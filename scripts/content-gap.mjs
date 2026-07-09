#!/usr/bin/env node
/**
 * Genessa Report Engine — Module 4.4: Content Gap Analysis
 *
 * Finds prompts where competitors appear but the own brand is absent,
 * then uses Claude haiku to generate gap explanations + recommendations.
 *
 * Usage (standalone):
 *   node scripts/content-gap.mjs --org-id=<uuid> [--report-id=<uuid>] [--days=30]
 *
 * Usage (as module):
 *   import { buildContentGap } from "./scripts/content-gap.mjs";
 *   const section = await buildContentGap({ orgId, reportId, days, supabase, anthropicKey });
 */

import { createClient } from "@supabase/supabase-js";

const CLAUDE_MODEL   = "claude-haiku-4-5-20251001";
const FETCH_TIMEOUT  = 30_000;
const MAX_GAPS       = 8;   // max prompts to analyse
const MAX_RESPONSES  = 3;   // sample responses per gap prompt (token budget)

// ── Fetch helper ───────────────────────────────────────────────────────────────

async function fetchWithTimeout(url, opts, ms = FETCH_TIMEOUT) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } catch (err) {
    if (err.name === "AbortError") throw new Error(`Timeout: ${url}`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ── Claude call ────────────────────────────────────────────────────────────────

async function callClaude(systemPrompt, userMessage, apiKey) {
  const res = await fetchWithTimeout(
    "https://api.anthropic.com/v1/messages",
    {
      method:  "POST",
      headers: {
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json",
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: 2048,
        system:     systemPrompt,
        messages:   [{ role: "user", content: userMessage }],
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.content?.[0]?.text ?? "";
}

// ── Data loading ───────────────────────────────────────────────────────────────

async function loadGapData(supabase, orgId, days) {
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();

  // 1. Get all prompts for this org
  const { data: prompts, error: pErr } = await supabase
    .from("engine_prompts")
    .select("id, prompt_text")
    .eq("organization_id", orgId);
  if (pErr) throw new Error(`engine_prompts fetch: ${pErr.message}`);
  if (!prompts?.length) return { ownBrand: null, gaps: [] };

  const promptIds = prompts.map(p => p.id);
  const promptMap = Object.fromEntries(prompts.map(p => [p.id, p.prompt_text]));

  // 2. Get completed runs within time window
  const { data: runs, error: rErr } = await supabase
    .from("engine_runs")
    .select("id, prompt_id, engine, raw_response_text")
    .in("prompt_id", promptIds)
    .gte("run_timestamp", cutoff)
    .eq("status", "completed");
  if (rErr) throw new Error(`engine_runs fetch: ${rErr.message}`);
  if (!runs?.length) return { ownBrand: null, gaps: [] };

  const runIds = runs.map(r => r.id);

  // 3. Get all brand_mentions for those runs
  const { data: mentions, error: mErr } = await supabase
    .from("brand_mentions")
    .select("run_id, brand_name, is_own_brand, sentiment, position_in_response")
    .in("run_id", runIds);
  if (mErr) throw new Error(`brand_mentions fetch: ${mErr.message}`);

  // 4. Identify own brand name (first is_own_brand=true mention)
  const ownBrandMention = mentions?.find(m => m.is_own_brand);
  const ownBrand = ownBrandMention?.brand_name ?? null;

  // 5. Group mentions by run_id
  const mentionsByRun = {};
  for (const m of mentions ?? []) {
    if (!mentionsByRun[m.run_id]) mentionsByRun[m.run_id] = [];
    mentionsByRun[m.run_id].push(m);
  }

  // 6. Group runs by prompt_id
  const runsByPrompt = {};
  for (const r of runs) {
    if (!runsByPrompt[r.prompt_id]) runsByPrompt[r.prompt_id] = [];
    runsByPrompt[r.prompt_id].push(r);
  }

  // 7. Per prompt — find gaps (own brand never mentioned across all runs)
  const gaps = [];
  for (const promptId of Object.keys(runsByPrompt)) {
    const promptRuns = runsByPrompt[promptId];
    const allMentions = promptRuns.flatMap(r => mentionsByRun[r.id] ?? []);

    const ownBrandMentioned = allMentions.some(m => m.is_own_brand);
    if (ownBrandMentioned) continue; // own brand present → not a gap

    // Count competitor mentions
    const competitorCounts = {};
    for (const m of allMentions) {
      if (!m.is_own_brand) {
        competitorCounts[m.brand_name] = (competitorCounts[m.brand_name] ?? 0) + 1;
      }
    }
    const topCompetitors = Object.entries(competitorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    if (topCompetitors.length === 0) continue; // no competitors either → skip

    // Sample raw responses for context
    const sampleResponses = promptRuns
      .slice(0, MAX_RESPONSES)
      .map(r => ({ engine: r.engine, excerpt: (r.raw_response_text ?? "").slice(0, 600) }));

    gaps.push({
      prompt:       promptMap[promptId],
      competitors:  topCompetitors,
      sampleRuns:   sampleResponses,
      runCount:     promptRuns.length,
    });
  }

  // Sort by competitor density desc, cap
  gaps.sort((a, b) => b.competitors[0]?.count - a.competitors[0]?.count);
  return { ownBrand, gaps: gaps.slice(0, MAX_GAPS) };
}

// ── Claude gap analysis ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an AI visibility strategist. You analyse data about which AI engines
(Claude, GPT-4o, Perplexity) mention competitor brands but NOT the client's own brand.
Your job is to explain WHY the gap exists and give a concrete, actionable recommendation
to fix it — focused on content, schema markup, and entity signals.

Respond ONLY with valid JSON — no markdown fences, no prose outside the JSON.`;

async function analyseGaps(ownBrand, gaps, anthropicKey) {
  const userMessage = `
Own brand: "${ownBrand}"

For each prompt below, the own brand was NOT mentioned by any AI engine, but competitors were.
Analyse each gap and produce one structured object per gap.

Gaps:
${gaps.map((g, i) => `
[${i + 1}] Prompt: "${g.prompt}"
  Run count: ${g.runCount}
  Top competitors mentioned: ${g.competitors.map(c => `${c.name} (${c.count}x)`).join(", ")}
  Sample AI response excerpt:
  ---
  ${g.sampleRuns.map(r => `[${r.engine}] ${r.excerpt}`).join("\n  ---\n  ")}
`).join("\n")}

Return JSON:
{
  "gaps": [
    {
      "prompt": "<the prompt text>",
      "gap_type": "<one of: missing_from_recommendation | wrong_category | no_entity_recognition | topic_not_covered>",
      "gap_explanation": "<1-2 sentences: why is the brand missing here?>",
      "competitors_present": ["<name>", ...],
      "recommendation": "<1-3 concrete actions to close this gap>",
      "priority": "<high|medium|low>"
    }
  ]
}`;

  const raw = await callClaude(SYSTEM_PROMPT, userMessage, anthropicKey);

  try {
    const cleaned = raw.replace(/```(?:json)?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    console.error("[content-gap] JSON parse failed, raw:", raw.slice(0, 300));
    return { gaps: [] };
  }
}

// ── Main export ────────────────────────────────────────────────────────────────

/**
 * @param {{ orgId, reportId?, days?, supabase, anthropicKey }} opts
 * @returns {Promise<object>} content_json for report_sections
 */
export async function buildContentGap({ orgId, reportId, days = 30, supabase, anthropicKey }) {
  const { ownBrand, gaps: rawGaps } = await loadGapData(supabase, orgId, days);

  if (!ownBrand) {
    console.log("[content-gap] No own-brand mentions found — no engine runs yet?");
    const content = { own_brand: null, gap_count: 0, analyzed_prompts: 0, gaps: [] };
    if (reportId) await saveSection(supabase, reportId, content);
    return content;
  }

  if (rawGaps.length === 0) {
    console.log("[content-gap] No gaps found — own brand present in all prompts.");
    const content = { own_brand: ownBrand, gap_count: 0, analyzed_prompts: 0, gaps: [] };
    if (reportId) await saveSection(supabase, reportId, content);
    return content;
  }

  console.log(`[content-gap] Own brand: "${ownBrand}", ${rawGaps.length} gap prompts. Calling Claude…`);

  const analysis = await analyseGaps(ownBrand, rawGaps, anthropicKey);

  const content = {
    own_brand:         ownBrand,
    period_days:       days,
    gap_count:         analysis.gaps?.length ?? 0,
    analyzed_prompts:  rawGaps.length,
    gaps:              analysis.gaps ?? [],
  };

  if (reportId) await saveSection(supabase, reportId, content);
  return content;
}

async function saveSection(supabase, reportId, content) {
  const { error } = await supabase
    .from("report_sections")
    .upsert(
      { report_id: reportId, section_key: "content_gap", content_json: content },
      { onConflict: "report_id,section_key" }
    );
  if (error) console.error("[content-gap] Upsert error:", error.message);
  else console.log("[content-gap] Saved → report_sections (content_gap)");
}

// ── CLI ────────────────────────────────────────────────────────────────────────

function parseCLIArgs(argv) {
  const flags = Object.fromEntries(
    argv.filter(a => a.startsWith("--")).map(a => {
      const [k, ...v] = a.slice(2).split("=");
      return [k, v.join("=") || true];
    })
  );
  return {
    orgId:    flags["org-id"],
    reportId: flags["report-id"],
    days:     flags["days"] ? parseInt(flags["days"], 10) : 30,
  };
}

if (process.argv[1] && new URL(process.argv[1], import.meta.url).pathname === new URL(import.meta.url).pathname) {
  const { orgId, reportId, days } = parseCLIArgs(process.argv.slice(2));

  if (!orgId) {
    console.error("Usage: node scripts/content-gap.mjs --org-id=<uuid> [--report-id=<uuid>] [--days=30]");
    process.exit(1);
  }

  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!supabaseUrl || !supabaseKey || !anthropicKey) {
    console.error("[content-gap] Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const result = await buildContentGap({ orgId, reportId, days, supabase, anthropicKey });

  console.log(`\n── Content Gap Results ───────────────────────────────────────`);
  console.log(`Own brand:        ${result.own_brand}`);
  console.log(`Period:           ${result.period_days} days`);
  console.log(`Prompts analysed: ${result.analyzed_prompts}`);
  console.log(`Gaps found:       ${result.gap_count}`);

  for (const gap of result.gaps ?? []) {
    console.log(`\n  [${gap.priority?.toUpperCase() ?? "?"}] "${gap.prompt}"`);
    console.log(`    Type:         ${gap.gap_type}`);
    console.log(`    Competitors:  ${gap.competitors_present?.join(", ")}`);
    console.log(`    Why:          ${gap.gap_explanation}`);
    console.log(`    Fix:          ${gap.recommendation}`);
  }
}
