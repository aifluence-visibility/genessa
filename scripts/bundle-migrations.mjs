#!/usr/bin/env node
/**
 * Concatenates supabase/migrations/*.sql in sorted order for one-shot paste into Supabase SQL Editor.
 * Output: supabase/_bundle_stage1.sql (gitignored)
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = process.cwd();
const migDir = resolve(root, "supabase/migrations");
const files = readdirSync(migDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

let out = `-- BUNDLED Stage 1 migrations (generated). Idempotent: safe to re-run after partial failures.\n`;
out += `-- Source files: ${files.length} from supabase/migrations/\n\n`;

for (const f of files) {
  out += `-- === ${f} ===\n`;
  out += readFileSync(join(migDir, f), "utf8").trimEnd();
  out += `\n\n`;
}

const dest = resolve(root, "supabase/_bundle_stage1.sql");
writeFileSync(dest, out, "utf8");
console.log(`[db:bundle] Wrote ${dest} (${files.length} files).`);
