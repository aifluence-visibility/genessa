import "server-only";

import type { NextRequest } from "next/server";

/** Shared with workers / cron; must match `x-internal-secret` header. */
export function internalSecretConfigured(): boolean {
  return Boolean(process.env.INTERNAL_API_SECRET?.trim());
}

export function verifyInternalSecret(request: NextRequest): boolean {
  const expected = process.env.INTERNAL_API_SECRET?.trim();
  if (!expected) {
    return false;
  }
  const header = request.headers.get("x-internal-secret")?.trim();
  return header === expected;
}
