import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Loads `.env.local` from cwd into `process.env` (last assignment wins per key).
 * @returns {string} absolute path to .env.local
 */
export function loadEnvLocal(cwd = process.cwd()) {
  const envPath = resolve(cwd, ".env.local");
  if (!existsSync(envPath)) {
    return envPath;
  }
  const raw = readFileSync(envPath, "utf8").replace(/^\uFEFF/, "");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  for (const [k, v] of Object.entries(env)) {
    process.env[k] = v;
  }
  return envPath;
}
