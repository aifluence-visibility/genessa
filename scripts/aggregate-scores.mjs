#!/usr/bin/env node
/**
 * Local / manual aggregation script.
 * Calls aggregate_all_engine_scores() for the specified period (defaults to current ISO week).
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL or INTERNAL_API_SUPABASE_URL  — required
 *   SUPABASE_SERVICE_ROLE_KEY                              — required
 *
 * Usage:
 *   npm run aggregate-scores
 *   PERIOD_START=2026-06-01 PERIOD_END=2026-06-30 npm run aggregate-scores
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.INTERNAL_API_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  console.error("[aggregate-scores] Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

function weekStart(d) {
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

const now = new Date();
const periodStart = process.env.PERIOD_START || toDateStr(weekStart(now));
const periodEnd   = process.env.PERIOD_END   || toDateStr(now);

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log(`[aggregate-scores] Period: ${periodStart} → ${periodEnd}`);

const { data, error } = await supabase.rpc("aggregate_all_engine_scores", {
  p_period_start: periodStart,
  p_period_end:   periodEnd,
});

if (error) {
  console.error("[aggregate-scores] Error:", error.message);
  process.exit(1);
}

console.log(`[aggregate-scores] Done — ${data} engine×locale row(s) written.`);
