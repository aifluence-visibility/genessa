#!/usr/bin/env node
/**
 * Genessa Report Engine — Module 4.6: Unified AI Visibility Score
 *
 * Combines three sub-scores into one 0-100 Genessa Score:
 *   - Technical Score   (30%) — from technical_scans
 *   - Citation Score    (40%) — own brand citation rate across engines
 *   - Sentiment Score   (30%) — avg positive sentiment of own brand mentions
 *
 * Saves ai_visibility_score to reports table and returns the breakdown.
 *
 * Usage (standalone):
 *   node scripts/score-unified.mjs --org-id=<uuid> [--report-id=<uuid>] [--days=30]
 *
 * Usage (as module):
 *   import { computeUnifiedScore } from "./scripts/score-unified.mjs";
 *   const score = await computeUnifiedScore({ orgId, reportId, days, supabase });
 */

import { createClient } from "@supabase/supabase-js";

// Sub-score weights — must sum to 1
const WEIGHTS = {
  technical: 0.30,
  citation:  0.40,
  sentiment: 0.30,
};

/**
 * @param {{ orgId, reportId?, days?, supabase }} opts
 * @returns {Promise<object>} score breakdown
 */
export async function computeUnifiedScore({ orgId, reportId, days = 30, supabase }) {
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();

  // ── 1. Technical score ────────────────────────────────────────────────────
  const { data: scans } = await supabase
    .from("technical_scans")
    .select("technical_score, scanned_at")
    .eq("organization_id", orgId)
    .order("scanned_at", { ascending: false })
    .limit(1);

  const technicalScore = scans?.[0]?.technical_score ?? null;

  // ── 2. Citation rate (own brand, last N days) ─────────────────────────────
  // Get prompts → runs → mentions
  const { data: prompts } = await supabase
    .from("engine_prompts")
    .select("id")
    .eq("organization_id", orgId);

  const promptIds = prompts?.map(p => p.id) ?? [];

  let citationScore    = null;
  let sentimentScore   = null;
  let citationDetails  = {};

  if (promptIds.length > 0) {
    const { data: runs } = await supabase
      .from("engine_runs")
      .select("id, engine")
      .in("prompt_id", promptIds)
      .gte("run_timestamp", cutoff)
      .eq("status", "completed");

    if (runs?.length) {
      const runIds = runs.map(r => r.id);

      const { data: mentions } = await supabase
        .from("brand_mentions")
        .select("run_id, brand_name, is_own_brand, sentiment")
        .in("run_id", runIds)
        .eq("is_own_brand", true);

      // Count runs where own brand was mentioned per engine
      const runMentionSet = new Set(mentions?.map(m => m.run_id) ?? []);

      const runsByEngine = {};
      for (const r of runs) {
        if (!runsByEngine[r.engine]) runsByEngine[r.engine] = [];
        runsByEngine[r.engine].push(r.id);
      }

      let totalRuns     = 0;
      let mentionedRuns = 0;
      for (const [engine, ids] of Object.entries(runsByEngine)) {
        const mentioned = ids.filter(id => runMentionSet.has(id)).length;
        citationDetails[engine] = {
          total_runs: ids.length,
          mentioned_runs: mentioned,
          citation_rate: ids.length > 0 ? Math.round((mentioned / ids.length) * 1000) / 1000 : 0,
        };
        totalRuns     += ids.length;
        mentionedRuns += mentioned;
      }

      // Overall citation rate → 0-100 score
      const overallRate = totalRuns > 0 ? mentionedRuns / totalRuns : 0;
      citationScore = Math.round(overallRate * 100);

      // Sentiment breakdown of own brand mentions
      const allMentions = mentions ?? [];
      if (allMentions.length > 0) {
        const pos = allMentions.filter(m => m.sentiment === "positive").length;
        const neu = allMentions.filter(m => m.sentiment === "neutral").length;
        const neg = allMentions.filter(m => m.sentiment === "negative").length;
        const total = allMentions.length;
        // Score: positive=100, neutral=50, negative=0
        sentimentScore = Math.round(((pos * 100) + (neu * 50) + (neg * 0)) / total);
      }
    }
  }

  // ── 3. Unified score ──────────────────────────────────────────────────────
  // Use available sub-scores, re-weight if some are missing
  const available = [
    technicalScore != null ? { key: "technical", value: technicalScore, weight: WEIGHTS.technical } : null,
    citationScore  != null ? { key: "citation",  value: citationScore,  weight: WEIGHTS.citation  } : null,
    sentimentScore != null ? { key: "sentiment", value: sentimentScore, weight: WEIGHTS.sentiment } : null,
  ].filter(Boolean);

  let unifiedScore = null;
  if (available.length > 0) {
    const totalWeight = available.reduce((s, x) => s + x.weight, 0);
    const weighted    = available.reduce((s, x) => s + x.value * x.weight, 0);
    unifiedScore = Math.round(weighted / totalWeight);
  }

  // ── 4. Grade label ────────────────────────────────────────────────────────
  function gradeLabel(score) {
    if (score == null) return "N/A";
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    if (score >= 30) return "Poor";
    return "Critical";
  }

  const breakdown = {
    unified_score:    unifiedScore,
    grade:            gradeLabel(unifiedScore),
    period_days:      days,
    weights:          WEIGHTS,
    sub_scores: {
      technical: { score: technicalScore, weight: WEIGHTS.technical, label: gradeLabel(technicalScore) },
      citation:  { score: citationScore,  weight: WEIGHTS.citation,  label: gradeLabel(citationScore)  },
      sentiment: { score: sentimentScore, weight: WEIGHTS.sentiment, label: gradeLabel(sentimentScore) },
    },
    citation_by_engine: citationDetails,
  };

  // ── 5. Write to reports + report_sections ────────────────────────────────
  if (reportId && unifiedScore != null) {
    const { error: rErr } = await supabase
      .from("reports")
      .update({ ai_visibility_score: unifiedScore })
      .eq("id", reportId);
    if (rErr) console.error("[score-unified] reports update error:", rErr.message);
    else console.log(`[score-unified] Saved ai_visibility_score=${unifiedScore} → reports`);

    const { error: sErr } = await supabase
      .from("report_sections")
      .upsert(
        { report_id: reportId, section_key: "ai_visibility", content_json: breakdown },
        { onConflict: "report_id,section_key" }
      );
    if (sErr) console.error("[score-unified] report_sections upsert error:", sErr.message);
    else console.log("[score-unified] Saved → report_sections (ai_visibility)");
  }

  return breakdown;
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
    console.error("Usage: node scripts/score-unified.mjs --org-id=<uuid> [--report-id=<uuid>] [--days=30]");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !supabaseKey) {
    console.error("[score-unified] Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const result = await computeUnifiedScore({ orgId, reportId, days, supabase });

  console.log(`\n── Unified AI Visibility Score ───────────────────────────────`);
  console.log(`Score:     ${result.unified_score ?? "N/A"} / 100  (${result.grade})`);
  console.log(`Period:    ${result.period_days} days`);
  console.log(`\n── Sub-scores ────────────────────────────────────────────────`);
  for (const [key, sub] of Object.entries(result.sub_scores)) {
    const pct = Math.round((sub.weight ?? 0) * 100);
    const bar = sub.score != null ? "█".repeat(Math.round(sub.score / 10)) : "—";
    console.log(`  ${key.padEnd(12)} ${String(sub.score ?? "—").padStart(3)}/100  [${pct}%]  ${bar}  ${sub.label}`);
  }
  if (Object.keys(result.citation_by_engine).length > 0) {
    console.log(`\n── Citation Rate by Engine ───────────────────────────────────`);
    for (const [eng, d] of Object.entries(result.citation_by_engine)) {
      const rate = (d.citation_rate * 100).toFixed(1);
      console.log(`  ${eng.padEnd(12)} ${rate}%  (${d.mentioned_runs}/${d.total_runs} runs)`);
    }
  }
}
