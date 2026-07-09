#!/usr/bin/env node
/**
 * Genessa Report Engine — Module 4.3: Competitor Comparison
 *
 * Calls get_competitor_comparison() RPC and saves the result as a
 * report_sections row (section_key = 'competitor_comparison').
 *
 * Usage (standalone):
 *   node scripts/competitor-aggregate.mjs --org-id=<uuid> [--report-id=<uuid>] [--days=30]
 *
 * Usage (as module):
 *   import { buildCompetitorComparison } from "./scripts/competitor-aggregate.mjs";
 *   const section = await buildCompetitorComparison({ orgId, reportId, days, supabase });
 */

import { createClient } from "@supabase/supabase-js";

/**
 * @param {{ orgId: string, reportId?: string, days?: number, supabase: object }} opts
 * @returns {Promise<object>}  content_json for the competitor_comparison section
 */
export async function buildCompetitorComparison({ orgId, reportId, days = 30, supabase }) {
  // Call the SQL RPC
  const { data, error } = await supabase.rpc("get_competitor_comparison", {
    p_org_id: orgId,
    p_days:   days,
  });

  if (error) throw new Error(`get_competitor_comparison RPC failed: ${error.message}`);

  const content = data ?? { period_days: days, engines: [], run_counts: {}, brands: [] };

  // Persist to report_sections if we have a report_id
  if (reportId) {
    const { error: upsertErr } = await supabase
      .from("report_sections")
      .upsert(
        { report_id: reportId, section_key: "competitor_comparison", content_json: content },
        { onConflict: "report_id,section_key" }
      );
    if (upsertErr) console.error("[competitor-aggregate] Upsert error:", upsertErr.message);
    else console.log(`[competitor-aggregate] Saved → report_sections (competitor_comparison)`);
  }

  return content;
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
    console.error("Usage: node scripts/competitor-aggregate.mjs --org-id=<uuid> [--report-id=<uuid>] [--days=30]");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    console.error("[competitor-aggregate] Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`[competitor-aggregate] Aggregating for org=${orgId} days=${days}…`);
  const result = await buildCompetitorComparison({ orgId, reportId, days, supabase });

  const { brands = [], engines = [], run_counts = {} } = result;
  const ownBrand   = brands.find(b => b.is_own_brand);
  const competitors = brands.filter(b => !b.is_own_brand);

  console.log(`\n── Engines: ${engines.join(", ") || "none"}`);
  console.log(`   Run counts: ${JSON.stringify(run_counts)}`);
  console.log(`\n── Brands (${brands.length} total) ──────────────────────────────`);

  for (const b of brands) {
    const tag = b.is_own_brand ? " [OWN]" : "";
    console.log(`\n  ${b.name}${tag}`);
    console.log(`    Total mentions : ${b.total_mentions}`);
    console.log(`    Avg position   : ${b.avg_position ?? "—"}`);
    console.log(`    Sentiment      : +${(b.sentiment?.positive * 100).toFixed(0)}% / ~${(b.sentiment?.neutral * 100).toFixed(0)}% / -${(b.sentiment?.negative * 100).toFixed(0)}%`);
    if (b.by_engine) {
      for (const [eng, stats] of Object.entries(b.by_engine)) {
        console.log(`    [${eng}] mentions=${stats.mentions}  citation_rate=${(stats.citation_rate * 100).toFixed(1)}%  pos=${stats.avg_position}`);
      }
    }
  }

  if (ownBrand && competitors.length > 0) {
    console.log(`\n── Share of Voice vs Own Brand ──────────────────────────────`);
    const totalAll = brands.reduce((s, b) => s + (b.total_mentions ?? 0), 0);
    for (const b of brands) {
      const sov = totalAll > 0 ? ((b.total_mentions / totalAll) * 100).toFixed(1) : "0.0";
      const bar = "█".repeat(Math.round(parseFloat(sov) / 5));
      console.log(`  ${b.name.padEnd(30)} ${sov.padStart(5)}%  ${bar}`);
    }
  }
}
