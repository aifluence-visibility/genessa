#!/usr/bin/env node
/**
 * Genessa Report Engine — Module 4.7: Action Plan Generator
 *
 * Synthesises data from technical_scans, content_gap, competitor_comparison,
 * and the unified score into a prioritised Faz 1 / Faz 2 / Faz 3 action plan
 * using Claude haiku with structured JSON output.
 *
 * Usage (standalone):
 *   node scripts/action-plan.mjs --org-id=<uuid> [--report-id=<uuid>] [--days=30]
 *
 * Usage (as module):
 *   import { buildActionPlan } from "./scripts/action-plan.mjs";
 *   const plan = await buildActionPlan({ orgId, reportId, days, supabase, anthropicKey });
 */

import { createClient } from "@supabase/supabase-js";

const CLAUDE_MODEL  = "claude-haiku-4-5-20251001";
const FETCH_TIMEOUT = 45_000;

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

async function callClaude(system, user, apiKey) {
  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method:  "POST",
    headers: {
      "x-api-key":         apiKey,
      "anthropic-version": "2023-06-01",
      "content-type":      "application/json",
    },
    body: JSON.stringify({
      model:      CLAUDE_MODEL,
      max_tokens: 3000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.content?.[0]?.text ?? "";
}

// ── Data loader ────────────────────────────────────────────────────────────────

async function loadContext(supabase, orgId, reportId, days) {
  const ctx = {};

  // Latest technical scan for this org
  const { data: scans } = await supabase
    .from("technical_scans")
    .select("technical_score, checks, ai_bot_permissions, llms_txt_accessible, has_json_ld, schema_types, robots_accessible, sitemap_accessible")
    .eq("organization_id", orgId)
    .order("scanned_at", { ascending: false })
    .limit(1);
  ctx.technicalScan = scans?.[0] ?? null;

  // Load from report_sections if we have a reportId
  if (reportId) {
    const { data: sections } = await supabase
      .from("report_sections")
      .select("section_key, content_json")
      .eq("report_id", reportId)
      .in("section_key", ["content_gap", "competitor_comparison", "ai_visibility"]);

    for (const s of sections ?? []) {
      ctx[s.section_key] = s.content_json;
    }
  }

  // Fallback: run competitor comparison inline if not in sections
  if (!ctx.competitor_comparison) {
    const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
    const { data: prompts } = await supabase
      .from("engine_prompts")
      .select("id")
      .eq("organization_id", orgId);
    const promptIds = prompts?.map(p => p.id) ?? [];
    if (promptIds.length > 0) {
      const { data: runs } = await supabase
        .from("engine_runs")
        .select("id, engine")
        .in("prompt_id", promptIds)
        .gte("run_timestamp", cutoff)
        .eq("status", "completed");

      const runIds = runs?.map(r => r.id) ?? [];
      if (runIds.length > 0) {
        const { data: mentions } = await supabase
          .from("brand_mentions")
          .select("brand_name, is_own_brand, sentiment")
          .in("run_id", runIds);

        const ownBrand = mentions?.find(m => m.is_own_brand)?.brand_name ?? null;
        const allMentions = mentions ?? [];
        const ownCount = allMentions.filter(m => m.is_own_brand).length;
        const total    = allMentions.length;
        ctx.competitor_comparison = {
          own_brand: ownBrand,
          own_mentions: ownCount,
          total_mentions: total,
          sov: total > 0 ? Math.round((ownCount / total) * 1000) / 10 : 0,
        };
      }
    }
  }

  return ctx;
}

// ── Prompt builder ─────────────────────────────────────────────────────────────

const SYSTEM = `You are a senior AI visibility strategist writing the action plan section of a
professional audit report. You synthesise technical SEO findings, AI engine data, and content gaps
into three implementation phases for the client's team.

Be specific, concrete, and prioritised. Each action should name the exact deliverable.
Respond ONLY with valid JSON — no markdown, no prose outside the JSON.`;

function buildPrompt(ctx) {
  const { technicalScan, content_gap, competitor_comparison, ai_visibility } = ctx;

  const techSummary = technicalScan
    ? `Technical score: ${technicalScan.technical_score}/100.
       llms.txt: ${technicalScan.llms_txt_accessible ? "present" : "MISSING"}.
       JSON-LD: ${technicalScan.has_json_ld ? "present" : "MISSING"} (types: ${technicalScan.schema_types?.join(", ") || "none"}).
       robots.txt: ${technicalScan.robots_accessible ? "present" : "MISSING"}.
       sitemap: ${technicalScan.sitemap_accessible ? "present" : "MISSING"}.
       AI bot permissions: ${JSON.stringify(technicalScan.ai_bot_permissions ?? {})}.
       Failed checks: ${Object.entries(technicalScan.checks ?? {})
         .filter(([, v]) => v.status === "fail")
         .map(([k, v]) => `${k} (${v.detail?.slice(0, 80)})`)
         .join("; ") || "none"}.`
    : "Technical scan not yet run.";

  const competitorSummary = competitor_comparison
    ? `Own brand: ${competitor_comparison.own_brand ?? "unknown"}.
       Unified AI Visibility Score: ${ai_visibility?.unified_score ?? "N/A"}/100 (${ai_visibility?.grade ?? "N/A"}).
       Citation rate: ${ai_visibility?.sub_scores?.citation?.score ?? "N/A"}% (across all engines).
       Share of Voice: ${competitor_comparison.sov ?? "N/A"}% of all brand mentions.
       Top competing brands: ${competitor_comparison.brands?.slice(0, 5).map(b => b.name).join(", ") ?? "see data"}.`
    : "Competitor data not yet available.";

  const gapSummary = content_gap?.gaps?.length
    ? `Content gaps (${content_gap.gap_count} prompts with NO own-brand mention):
       ${content_gap.gaps.slice(0, 4).map(g =>
         `- "${g.prompt}" → type: ${g.gap_type}, competitors: ${g.competitors_present?.join(", ")}`
       ).join("\n       ")}`
    : "No content gaps analysed yet.";

  return `
Client overview:
${techSummary}

Visibility & Competitors:
${competitorSummary}

Content Gaps:
${gapSummary}

Generate a three-phase action plan to improve AI visibility. Return JSON:
{
  "summary": "<2-3 sentence executive summary of the most critical issues>",
  "phases": [
    {
      "phase": 1,
      "title": "Quick Wins (Week 1-2)",
      "focus": "<one sentence on the theme of this phase>",
      "effort": "low",
      "expected_impact": "<what metric improves and by how much>",
      "actions": [
        {
          "action": "<specific deliverable — e.g. 'Add llms.txt with brand description'>",
          "rationale": "<why this matters for AI visibility>",
          "owner": "<who does this: dev | content | seo | management>",
          "hours_estimate": "<e.g. 2h>",
          "priority": "critical|high|medium"
        }
      ]
    },
    {
      "phase": 2,
      "title": "Foundation (Week 3-6)",
      "focus": "...",
      "effort": "medium",
      "expected_impact": "...",
      "actions": [...]
    },
    {
      "phase": 3,
      "title": "Authority Building (Month 2-3)",
      "focus": "...",
      "effort": "high",
      "expected_impact": "...",
      "actions": [...]
    }
  ],
  "expected_score_range": {
    "low": <number 0-100>,
    "high": <number 0-100>,
    "timeline_weeks": <number>
  }
}

Each phase should have 3-5 actions. Be concrete — name specific pages, files, Schema types.`;
}

// ── Main export ────────────────────────────────────────────────────────────────

export async function buildActionPlan({ orgId, reportId, days = 30, supabase, anthropicKey }) {
  console.log("[action-plan] Loading context…");
  const ctx = await loadContext(supabase, orgId, reportId, days);

  const prompt = buildPrompt(ctx);
  console.log("[action-plan] Calling Claude for action plan…");
  const raw = await callClaude(SYSTEM, prompt, anthropicKey);

  let plan;
  try {
    const cleaned = raw.replace(/```(?:json)?/g, "").trim();
    plan = JSON.parse(cleaned);
  } catch {
    console.error("[action-plan] JSON parse failed:", raw.slice(0, 300));
    plan = { summary: raw.slice(0, 500), phases: [] };
  }

  if (reportId) {
    const { error } = await supabase
      .from("report_sections")
      .upsert(
        { report_id: reportId, section_key: "action_plan", content_json: plan },
        { onConflict: "report_id,section_key" }
      );
    if (error) console.error("[action-plan] Upsert error:", error.message);
    else console.log("[action-plan] Saved → report_sections (action_plan)");
  }

  return plan;
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
    console.error("Usage: node scripts/action-plan.mjs --org-id=<uuid> [--report-id=<uuid>] [--days=30]");
    process.exit(1);
  }

  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!supabaseUrl || !supabaseKey || !anthropicKey) {
    console.error("[action-plan] Missing: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const plan = await buildActionPlan({ orgId, reportId, days, supabase, anthropicKey });

  console.log(`\n── Action Plan ───────────────────────────────────────────────`);
  console.log(`Summary: ${plan.summary}`);
  for (const phase of plan.phases ?? []) {
    console.log(`\n── Phase ${phase.phase}: ${phase.title}`);
    console.log(`   Focus:  ${phase.focus}`);
    console.log(`   Impact: ${phase.expected_impact}`);
    for (const a of phase.actions ?? []) {
      const icon = a.priority === "critical" ? "🔴" : a.priority === "high" ? "🟠" : "🟡";
      console.log(`   ${icon} [${a.owner}/${a.hours_estimate}] ${a.action}`);
    }
  }
  if (plan.expected_score_range) {
    const r = plan.expected_score_range;
    console.log(`\n── Expected Score after ${r.timeline_weeks}w: ${r.low}–${r.high}/100`);
  }
}
