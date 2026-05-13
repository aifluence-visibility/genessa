import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { internalSecretConfigured, verifyInternalSecret } from "@/lib/internal/verify-internal-secret";
import { enqueueAgentRunForTask } from "@/lib/internal/enqueue-agent-run";

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/**
 * POST /api/internal/runs
 * Header-x-internal-secret: INTERNAL_API_SECRET
 * Body: { taskId: string, idempotencyKey?: string }
 *
 * Enqueues `pending` agent run (idempotent via run_key). Workers claim via PATCH.
 */
export async function POST(request: NextRequest) {
  if (!internalSecretConfigured()) {
    return bad("internal_api_not_configured", 503);
  }
  if (!verifyInternalSecret(request)) {
    return bad("unauthorized", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad("invalid_json");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return bad("invalid_body");
  }
  const taskId = typeof (body as { taskId?: string }).taskId === "string" ? (body as { taskId: string }).taskId.trim() : "";
  const idemRaw = (body as { idempotencyKey?: string }).idempotencyKey;
  const idempotencyKey = typeof idemRaw === "string" && idemRaw.trim() ? idemRaw.trim().slice(0, 200) : "default";

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return bad("supabase_not_configured", 503);
  }

  const result = await enqueueAgentRunForTask(supabase, taskId, {
    idempotencyKey,
    enqueuedVia: "api_internal_runs",
  });

  if (!result.ok) {
    const code = result.error;
    if (code === "invalid_task_id") return bad(code);
    if (code === "task_not_found") return bad(code, 404);
    if (code === "task_cancelled") return bad(code, 409);
    if (code === "agent_runs_table_missing") return bad(code, 503);
    if (code === "task_lookup_failed") return bad(code, 500);
    return bad(code, 500);
  }

  return NextResponse.json({
    ok: true,
    deduped: result.deduped,
    runId: result.runId,
    status: result.status,
    runKey: result.runKey,
  });
}
