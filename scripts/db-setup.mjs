#!/usr/bin/env node
/**
 * Stage 1 database setup orchestrator (incremental, safe by default).
 *
 * Always:
 * - Regenerates `supabase/_bundle_stage1.sql`
 *
 * When `DB_APPLY=1` AND `DATABASE_URL` is set AND `psql` is on PATH:
 * - Applies bundle via psql (stops on first error)
 * - Applies `supabase/seed.sql`
 *
 * Otherwise:
 * - Prints the two manual Supabase SQL Editor steps (no destructive action).
 *
 * Finally runs `npm run db:verify` when `SKIP_DB_VERIFY` is not set.
 *
 * Usage:
 *   npm run db:setup
 *   DB_APPLY=1 npm run db:setup
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvLocal } from "./load-env-local.mjs";

const root = process.cwd();
loadEnvLocal(root);

function runNode(scriptRelative, args = []) {
  const scriptPath = resolve(root, scriptRelative);
  const r = spawnSync(process.execPath, [scriptPath, ...args], { stdio: "inherit", env: process.env });
  return r.status ?? 1;
}

function hasPsql() {
  const r = spawnSync("psql", ["--version"], { stdio: "pipe", env: process.env });
  return r.status === 0;
}

const bundlePath = resolve(root, "supabase/_bundle_stage1.sql");
const seedPath = resolve(root, "supabase/seed.sql");

console.log("[db:setup] (1/3) Generating migration bundle…");
if (runNode("scripts/bundle-migrations.mjs") !== 0) {
  process.exit(1);
}

if (!existsSync(bundlePath)) {
  console.error("[db:setup] Expected bundle at", bundlePath);
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL?.trim();
const apply = process.env.DB_APPLY === "1";

let applied = false;

if (apply && databaseUrl) {
  if (!hasPsql()) {
    console.warn("[db:setup] DB_APPLY=1 set but `psql` not found. Use manual SQL editor steps below.");
  } else {
    console.log("[db:setup] (2/3) Applying bundle + seed via psql (ON_ERROR_STOP)…");
    const common = { stdio: "inherit", env: { ...process.env, PGSSLMODE: process.env.PGSSLMODE ?? "require" } };
    const b = spawnSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", bundlePath], common);
    if (b.status !== 0) {
      console.error("[db:setup] Bundle apply failed. Fix the SQL error, then re-run.");
      process.exit(1);
    }
    const s = spawnSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", seedPath], common);
    if (s.status !== 0) {
      console.error("[db:setup] Seed apply failed. Fix the SQL error (or skip seed if you already loaded data).");
      process.exit(1);
    }
    applied = true;
    console.log("[db:setup] Database migrations + seed applied via psql.");
  }
} else {
  console.log("\n[db:setup] (2/3) Manual step — Supabase Dashboard\n");
  console.log("  1) Open: SQL Editor → New query");
  console.log("  2) Paste the contents of:");
  console.log("     ", bundlePath);
  console.log("     Run the script (once per fresh project).");
  console.log("  3) Open a new query, paste:");
  console.log("     ", seedPath);
  console.log("     Run to load demo data for the admin UI.");
  console.log("\n[db:setup] Optional automation (local only):");
  console.log("  - Add DATABASE_URL to `.env.local` (Project Settings → Database → URI, use pooler or direct).");
  console.log("  - Install Postgres client (`psql` must be on PATH).");
  console.log("  - Run: DB_APPLY=1 npm run db:setup");
  console.log("");
}

if (process.env.SKIP_DB_VERIFY === "1") {
  console.log("[db:setup] SKIP_DB_VERIFY=1 — skipping npm run db:verify");
  process.exit(0);
}

console.log("[db:setup] (3/3) Verifying API connectivity (`npm run db:verify`)…");
const v = spawnSync("npm", ["run", "db:verify"], { stdio: "inherit", env: process.env, shell: true });
if (v.status !== 0) {
  if (!applied) {
    console.log(
      "\n[db:setup] Verify not OK yet — expected until migrations + seed are applied.\n" +
        "           Complete step (2) in the Supabase SQL Editor (or run with DB_APPLY=1), then: npm run db:verify",
    );
    process.exit(0);
  }
  console.error("\n[db:setup] Verify failed after apply. Check Supabase logs and re-run `npm run db:verify`.");
  process.exit(v.status ?? 1);
}

console.log("\n[db:setup] Stage 1 database foundation is wired. Next: `npm run dev` → /admin/dashboard");
process.exit(0);
