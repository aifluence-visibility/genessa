"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AdminAgentRunMutationResult = { ok: true } | { ok: false; error: string };

function parseRunId(runId: string): string | null {
  const id = runId?.trim() ?? "";
  if (!id || !uuidRe.test(id)) {
    return null;
  }
  return id;
}

function revalidateAgentSurfaces(runId: string, taskId: string) {
  revalidatePath("/admin/agent-runs");
  revalidatePath(`/admin/agent-runs/${runId}`);
  revalidatePath(`/admin/tasks/${taskId}`);
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/tasks");
}

/** Terminal a queued or in-flight run without executing work. */
export async function cancelAdminAgentRun(runId: string): Promise<AdminAgentRunMutationResult> {
  const id = parseRunId(runId);
  if (!id) {
    return { ok: false, error: "invalid_id" };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { ok: false, error: "supabase_not_configured" };
  }

  const { data: row, error: loadErr } = await supabase.from("agent_runs").select("id, status, task_id").eq("id", id).maybeSingle();

  if (loadErr) {
    console.error("[admin] cancelAgentRun load", loadErr);
    return { ok: false, error: "load_failed" };
  }
  if (!row) {
    return { ok: false, error: "not_found" };
  }

  const st = row.status as string;
  if (st !== "pending" && st !== "running") {
    return { ok: false, error: "invalid_state" };
  }

  const now = new Date().toISOString();
  const { data: updated, error: upErr } = await supabase
    .from("agent_runs")
    .update({
      status: "cancelled",
      finished_at: now,
      error_message: null,
    })
    .eq("id", id)
    .in("status", ["pending", "running"])
    .select("id")
    .maybeSingle();

  if (upErr) {
    console.error("[admin] cancelAgentRun update", upErr);
    return { ok: false, error: "update_failed" };
  }
  if (!updated) {
    return { ok: false, error: "concurrent_update" };
  }

  revalidateAgentSurfaces(id, row.task_id as string);
  return { ok: true };
}

/** Operator override when a worker is stuck in `running`. */
export async function failAdminAgentRunStuck(
  runId: string,
  message?: string | null,
): Promise<AdminAgentRunMutationResult> {
  const id = parseRunId(runId);
  if (!id) {
    return { ok: false, error: "invalid_id" };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { ok: false, error: "supabase_not_configured" };
  }

  const { data: row, error: loadErr } = await supabase.from("agent_runs").select("id, status, task_id").eq("id", id).maybeSingle();

  if (loadErr) {
    console.error("[admin] failAgentRun load", loadErr);
    return { ok: false, error: "load_failed" };
  }
  if (!row) {
    return { ok: false, error: "not_found" };
  }

  if ((row.status as string) !== "running") {
    return { ok: false, error: "invalid_state" };
  }

  const msg = (message?.trim() || "marked_failed_by_operator").slice(0, 2000);
  const now = new Date().toISOString();

  const { data: updated, error: upErr } = await supabase
    .from("agent_runs")
    .update({
      status: "failed",
      finished_at: now,
      error_message: msg,
    })
    .eq("id", id)
    .eq("status", "running")
    .select("id")
    .maybeSingle();

  if (upErr) {
    console.error("[admin] failAgentRun update", upErr);
    return { ok: false, error: "update_failed" };
  }
  if (!updated) {
    return { ok: false, error: "concurrent_update" };
  }

  revalidateAgentSurfaces(id, row.task_id as string);
  return { ok: true };
}
