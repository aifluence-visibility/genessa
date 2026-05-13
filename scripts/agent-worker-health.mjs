#!/usr/bin/env node
/**
 * Lightweight readiness check for deploy probes (no HTTP server required).
 *
 * Default: validates Supabase URL + service role key are set.
 * Deep: WORKER_HEALTH_DEEP=1 — runs `select id from agent_runs limit 1` (needs network to Supabase).
 *
 * Exit 0 = ok, 1 = misconfigured or DB unreachable (deep mode).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.INTERNAL_API_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const deep = ["1", "true", "yes"].includes(String(process.env.WORKER_HEALTH_DEEP ?? "").toLowerCase());

if (!url || !key) {
  console.error("[agent-worker-health] Set NEXT_PUBLIC_SUPABASE_URL (or INTERNAL_API_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

if (!deep) {
  console.log("[agent-worker-health] ok (env only). Set WORKER_HEALTH_DEEP=1 to ping Postgres.");
  process.exit(0);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error } = await supabase.from("agent_runs").select("id").limit(1);

if (error) {
  console.error("[agent-worker-health] agent_runs probe failed:", error.message);
  process.exit(1);
}

console.log("[agent-worker-health] ok (agent_runs reachable).");
process.exit(0);
