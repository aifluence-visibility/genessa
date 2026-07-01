#!/usr/bin/env node
/**
 * Engine worker: runs approved engine_prompts across Claude, GPT, and Perplexity.
 * For each prompt it runs ENGINE_WORKER_REPEATS queries per engine, saves raw
 * responses to engine_runs, then extracts brand mentions into brand_mentions.
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL or INTERNAL_API_SUPABASE_URL  — required
 *   SUPABASE_SERVICE_ROLE_KEY                              — required
 *   ANTHROPIC_API_KEY     — required for claude engine
 *   OPENAI_API_KEY        — required for gpt engine
 *   PERPLEXITY_API_KEY    — required for perplexity engine
 *
 *   ENGINE_WORKER_POLL_MS      — 0 = one-shot, >0 = loop interval (default 0)
 *   ENGINE_WORKER_BATCH        — max prompts per iteration (default 5)
 *   ENGINE_WORKER_REPEATS      — runs per prompt×engine (default 3)
 *   ENGINE_WORKER_DELAY_MS     — pause between individual API calls (default 500)
 *   ENGINE_WORKER_STALE_MS     — mark pending runs older than this as failed (default 1800000 = 30m)
 *   ENGINE_CLAUDE_MODEL        — default: claude-haiku-4-5-20251001
 *   ENGINE_GPT_MODEL           — default: gpt-4o-mini
 *   ENGINE_PERPLEXITY_MODEL    — default: llama-3.1-sonar-small-128k-online
 *   ENGINE_TIMEOUT_MS          — per-engine call timeout (default 30000)
 *
 * Usage:
 *   npm run worker:engine
 *   ENGINE_WORKER_POLL_MS=60000 ENGINE_WORKER_REPEATS=1 npm run worker:engine
 */

import { createClient } from "@supabase/supabase-js";
import { runEngine, getEngineCredentials } from "./tools/run-engine.mjs";
import { extractBrandMentions } from "./tools/extract-brand-mentions.mjs";

// ── Config ─────────────────────────────────────────────────────────────────────

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  process.env.INTERNAL_API_SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "[engine-worker] Set NEXT_PUBLIC_SUPABASE_URL (or INTERNAL_API_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const pollMs = Math.max(0, parseInt(process.env.ENGINE_WORKER_POLL_MS ?? "0", 10) || 0);
const batchSize = Math.max(1, parseInt(process.env.ENGINE_WORKER_BATCH ?? "5", 10) || 5);
const repeats = Math.max(1, Math.min(10, parseInt(process.env.ENGINE_WORKER_REPEATS ?? "3", 10) || 3));
const delayMs = Math.max(100, parseInt(process.env.ENGINE_WORKER_DELAY_MS ?? "500", 10) || 500);
const staleMs = Math.max(0, parseInt(process.env.ENGINE_WORKER_STALE_MS ?? "1800000", 10) || 1_800_000);

const creds = getEngineCredentials();

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let shuttingDown = false;
process.on("SIGINT", () => { shuttingDown = true; console.warn("[engine-worker] SIGINT received, finishing current work…"); });
process.on("SIGTERM", () => { shuttingDown = true; console.warn("[engine-worker] SIGTERM received, finishing current work…"); });

// ── Helpers ────────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function log(msg) {
  console.log(`[engine-worker] ${new Date().toISOString()} ${msg}`);
}

function warn(msg) {
  console.warn(`[engine-worker] ${new Date().toISOString()} ${msg}`);
}

/** Returns true when the engine key needed for this engine is configured. */
function engineEnabled(engine) {
  if (engine === "claude") return Boolean(creds.anthropicKey);
  if (engine === "gpt") return Boolean(creds.openaiKey);
  if (engine === "perplexity") return Boolean(creds.perplexityKey);
  return false;
}

// ── Stale run cleanup ──────────────────────────────────────────────────────────

async function failStaleRuns() {
  if (!staleMs) return;
  const cutoff = new Date(Date.now() - staleMs).toISOString();
  const { count } = await supabase
    .from("engine_runs")
    .update({ status: "failed", error_message: "worker_stale_timeout" })
    .eq("status", "pending")
    .lt("run_timestamp", cutoff)
    .select("id", { count: "exact", head: true });
  if (count) log(`Marked ${count} stale pending run(s) as failed.`);
}

// ── Prompt deduplication ───────────────────────────────────────────────────────

/**
 * Returns prompt IDs that are fully processed:
 * every enabled engine has >= repeats completed runs.
 */
async function getAlreadyRunPromptIds(candidates) {
  if (!candidates.length) return new Set();
  const ids = candidates.map((p) => p.id);

  const { data } = await supabase
    .from("engine_runs")
    .select("prompt_id, engine")
    .in("prompt_id", ids)
    .eq("status", "completed");

  // Build { promptId: { engine: count } }
  const counts = {};
  for (const row of data ?? []) {
    if (!counts[row.prompt_id]) counts[row.prompt_id] = {};
    counts[row.prompt_id][row.engine] = (counts[row.prompt_id][row.engine] ?? 0) + 1;
  }

  const doneIds = new Set();
  for (const p of candidates) {
    const engines = (p.target_engines ?? ["claude", "gpt", "perplexity"]).filter(engineEnabled);
    if (engines.length === 0) { doneIds.add(p.id); continue; }
    const pc = counts[p.id] ?? {};
    if (engines.every((e) => (pc[e] ?? 0) >= repeats)) doneIds.add(p.id);
  }

  return doneIds;
}

// ── Core processing ────────────────────────────────────────────────────────────

async function processPrompt(prompt, orgName, competitorNames) {
  const engines = (prompt.target_engines ?? ["claude", "gpt", "perplexity"]).filter(engineEnabled);

  if (!engines.length) {
    warn(`Prompt ${prompt.id}: no enabled engines — check API keys.`);
    return;
  }

  log(`Prompt ${prompt.id.slice(0, 8)}… "${prompt.prompt_text.slice(0, 60)}" — engines: ${engines.join(", ")} × ${repeats} repeats`);

  for (const engine of engines) {
    for (let repeat = 1; repeat <= repeats; repeat++) {
      if (shuttingDown) return;

      // Insert pending run
      const { data: run, error: insertErr } = await supabase
        .from("engine_runs")
        .insert({ prompt_id: prompt.id, engine, status: "pending" })
        .select("id")
        .single();

      if (insertErr || !run) {
        warn(`Prompt ${prompt.id} / ${engine} / repeat ${repeat}: insert failed — ${insertErr?.message}`);
        continue;
      }

      // Call engine
      await sleep(delayMs);
      const result = await runEngine(engine, prompt.prompt_text, creds);

      // Update run status
      if (result.error) {
        warn(`Prompt ${prompt.id} / ${engine} / repeat ${repeat}: engine error — ${result.error}`);
        await supabase.from("engine_runs").update({
          status: "failed",
          error_message: result.error.slice(0, 1000),
        }).eq("id", run.id);
        continue;
      }

      await supabase.from("engine_runs").update({
        status: "completed",
        raw_response_text: result.text,
      }).eq("id", run.id);

      log(`  ✓ ${engine} / repeat ${repeat} — ${result.text?.length ?? 0} chars`);

      // Extract brand mentions
      if (creds.anthropicKey && result.text) {
        await sleep(delayMs);
        const mentions = await extractBrandMentions(
          result.text,
          prompt.prompt_text,
          orgName,
          competitorNames,
          creds.anthropicKey,
        );

        if (mentions.length > 0) {
          await supabase.from("brand_mentions").insert(
            mentions.map((m) => ({ ...m, run_id: run.id })),
          );
          log(`  ↳ ${mentions.length} brand mention(s) extracted`);
        } else {
          log(`  ↳ no brand mentions`);
        }
      }
    }
  }
}

// ── Main batch ─────────────────────────────────────────────────────────────────

async function runBatch() {
  await failStaleRuns();

  // Fetch candidate prompts (active + approved)
  const { data: candidates, error } = await supabase
    .from("engine_prompts")
    .select("id, organization_id, prompt_text, target_locale, target_engines")
    .eq("is_active", true)
    .eq("is_user_approved", true)
    .order("created_at", { ascending: true })
    .limit(batchSize * 4); // over-fetch to account for dedup

  if (error) {
    warn(`Fetch prompts error: ${error.message}`);
    return;
  }

  if (!candidates?.length) {
    log("No approved prompts found.");
    return;
  }

  // Skip prompts where all enabled engines already have >= repeats completed runs
  const doneIds = await getAlreadyRunPromptIds(candidates);
  const due = candidates.filter((p) => !doneIds.has(p.id)).slice(0, batchSize);

  if (!due.length) {
    log(`All ${candidates.length} prompt(s) already have completed runs.`);
    return;
  }

  log(`Processing ${due.length} prompt(s) (${doneIds.size} already done, ${candidates.length} total).`);

  // Prefetch org names, credits, and competitor lists
  const orgIds = [...new Set(due.map((p) => p.organization_id))];
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, extra_query_credits")
    .in("id", orgIds);
  const { data: allCompetitors } = await supabase
    .from("tracked_competitors")
    .select("organization_id, competitor_name")
    .in("organization_id", orgIds);

  const orgMap = Object.fromEntries((orgs ?? []).map((o) => [o.id, o.name]));
  const orgCredits = Object.fromEntries((orgs ?? []).map((o) => [o.id, o.extra_query_credits ?? 0]));
  const competitorMap = {};
  for (const c of allCompetitors ?? []) {
    if (!competitorMap[c.organization_id]) competitorMap[c.organization_id] = [];
    competitorMap[c.organization_id].push(c.competitor_name);
  }

  // Filter out orgs with no credits
  const dueWithCredits = due.filter((p) => {
    const credits = orgCredits[p.organization_id] ?? 0;
    if (credits <= 0) {
      warn(`Prompt ${p.id.slice(0, 8)}… skipped — org ${p.organization_id.slice(0, 8)}… has no query credits.`);
      return false;
    }
    return true;
  });

  if (!dueWithCredits.length) {
    log("All due prompts belong to orgs with no credits — nothing to run.");
    return;
  }

  // Track which orgs we process so we can decrement credits after
  const processedOrgIds = new Set();

  for (const prompt of dueWithCredits) {
    if (shuttingDown) break;
    const orgName = orgMap[prompt.organization_id] ?? prompt.organization_id;
    const competitorNames = competitorMap[prompt.organization_id] ?? [];
    await processPrompt(prompt, orgName, competitorNames);
    processedOrgIds.add(prompt.organization_id);
  }

  // Decrement extra_query_credits by 1 for each org we ran prompts for
  for (const orgId of processedOrgIds) {
    const current = orgCredits[orgId] ?? 0;
    if (current <= 0) continue;
    const { error: creditErr } = await supabase
      .from("organizations")
      .update({ extra_query_credits: current - 1 })
      .eq("id", orgId);
    if (creditErr) {
      warn(`Failed to decrement credits for org ${orgId.slice(0, 8)}…: ${creditErr.message}`);
    } else {
      log(`Credits: org ${orgId.slice(0, 8)}… ${current} → ${current - 1}`);
    }
  }
}

// ── Entry point ────────────────────────────────────────────────────────────────

async function main() {
  log(
    `Starting — batch=${batchSize} repeats=${repeats} delay=${delayMs}ms poll=${pollMs}ms ` +
    `engines: claude=${Boolean(creds.anthropicKey)} gpt=${Boolean(creds.openaiKey)} perplexity=${Boolean(creds.perplexityKey)}`,
  );

  await runBatch();

  if (pollMs > 0) {
    while (!shuttingDown) {
      await sleep(pollMs);
      if (shuttingDown) break;
      await runBatch();
    }
  }

  log("Done.");
}

main().catch((e) => {
  console.error("[engine-worker] Fatal:", e);
  process.exit(1);
});
