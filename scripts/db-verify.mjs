#!/usr/bin/env node
/**
 * Verifies Stage 1 Supabase wiring:
 * - Required env vars present in .env.local (on disk)
 * - Can reach Supabase and read `public.organizations`
 *
 * Usage: npm run db:verify
 */
import { createClient } from "@supabase/supabase-js";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { loadEnvLocal } from "./load-env-local.mjs";

const root = process.cwd();
const envPath = loadEnvLocal(root);

if (!existsSync(envPath)) {
  console.error(`[db:verify] Missing ${resolve(root, ".env.local")} — create it from .env.example`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error(
    "[db:verify] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "           Ensure they exist in .env.local on disk (save the file in your editor), then retry.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.from("organizations").select("id").limit(1);

if (error) {
  const msg = String(error.message ?? error);
  const hint =
    /could not find the table .*organizations/i.test(msg) || /schema cache/i.test(msg)
      ? "Table `public.organizations` not found — apply migrations: run `npm run db:setup` and complete the SQL Editor steps (or `DB_APPLY=1` with DATABASE_URL + psql)."
      : msg;
  console.error("[db:verify] Query failed:", hint);
  process.exit(1);
}

console.log("[db:verify] OK — Supabase reachable; `organizations` readable (rows in sample:", data?.length ?? 0, ").");
console.log("[db:verify] If lists are empty, ensure `supabase/seed.sql` has been executed once.");
