import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { internalSecretConfigured, verifyInternalSecret } from "@/lib/internal/verify-internal-secret";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

type PatchBody = {
  status?: string;
  outputSummary?: string;
  errorMessage?: string;
  outputRef?: Record<string, unknown>;
};

/**
 * PATCH /api/internal/runs/:runId
 * Header x-internal-secret: INTERNAL_API_SECRET
 * Body: { status: 'running'|'succeeded'|'failed'|'cancelled', outputSummary?, errorMessage?, outputRef? }
 *
 * On `succeeded`, merges `outputSummary` into task.output_summary when provided.
 */
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ runId: string }> }) {
  if (!internalSecretConfigured()) {
    return bad("internal_api_not_configured", 503);
  }
  if (!verifyInternalSecret(request)) {
    return bad("unauthorized", 401);
  }

  const { runId: rawId } = await ctx.params;
  const runId = rawId?.trim() ?? "";
  if (!uuidRe.test(runId)) {
    return bad("invalid_run_id");
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return bad("invalid_json");
  }

  const status = typeof body.status === "string" ? body.status.trim() : "";
  if (!["running", "succeeded", "failed", "cancelled"].includes(status)) {
    return bad("invalid_status");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return bad("supabase_not_configured", 503);
  }

  const { data: run, error: runErr } = await supabase.from("agent_runs").select("id, task_id, status").eq("id", runId).maybeSingle();

  if (runErr) {
    console.error("[internal/runs PATCH] load", runErr);
    return bad("run_lookup_failed", 500);
  }
  if (!run) {
    return bad("run_not_found", 404);
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status,
    error_message: status === "failed" ? (body.errorMessage?.slice(0, 2000) ?? "failed") : null,
  };

  if (status === "running") {
    patch.started_at = now;
    patch.finished_at = null;
  }
  if (status === "succeeded" || status === "failed" || status === "cancelled") {
    patch.finished_at = now;
    if (body.outputRef && typeof body.outputRef === "object") {
      patch.output_ref = body.outputRef;
    }
  }

  const { error: upRunErr } = await supabase.from("agent_runs").update(patch).eq("id", runId);

  if (upRunErr) {
    console.error("[internal/runs PATCH] update run", upRunErr);
    return bad("run_update_failed", 500);
  }

  if (status === "succeeded" && body.outputSummary?.trim()) {
    const { data: task } = await supabase.from("tasks").select("output_summary").eq("id", run.task_id).maybeSingle();
    const prev = (task?.output_summary as string | null) ?? "";
    const next = prev ? `${prev}\n\n${body.outputSummary.trim()}` : body.outputSummary.trim();
    const { error: taskErr } = await supabase.from("tasks").update({ output_summary: next }).eq("id", run.task_id);
    if (taskErr) {
      console.error("[internal/runs PATCH] task update", taskErr);
      return bad("task_update_failed", 500);
    }
  }

  return NextResponse.json({ ok: true, runId, status });
}
