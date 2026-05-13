"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { enqueueAgentRunForTask } from "@/lib/internal/enqueue-agent-run";

export type UpdateAdminTaskResult = { ok: true } | { ok: false; error: string };

export type EnqueueAgentRunActionResult =
  | { ok: true; runId: string; deduped: boolean }
  | { ok: false; error: string };

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS = new Set(["todo", "in_progress", "blocked", "done", "cancelled"]);
const APPROVAL = new Set(["not_required", "pending", "approved", "rejected"]);

function parseTaskId(taskId: string): string | null {
  const id = taskId?.trim() ?? "";
  if (!id || !uuidRe.test(id)) {
    return null;
  }
  return id;
}

async function revalidateTaskSurfaces() {
  revalidatePath("/admin/tasks");
  revalidatePath("/admin/activity");
  revalidatePath("/admin/dashboard");
}

/**
 * Update task status and/or approval_state. Pass null/omit to leave a field unchanged.
 */
export async function updateAdminTask(
  taskId: string,
  input: { status?: string | null; approval_state?: string | null },
  actorLabel?: string | null,
): Promise<UpdateAdminTaskResult> {
  const id = parseTaskId(taskId);
  if (!id) {
    return { ok: false, error: "invalid_id" };
  }

  const status =
    input.status === undefined || input.status === null || input.status === ""
      ? null
      : String(input.status).trim();
  const approval_state =
    input.approval_state === undefined || input.approval_state === null || input.approval_state === ""
      ? null
      : String(input.approval_state).trim();

  if (status === null && approval_state === null) {
    return { ok: false, error: "no_fields" };
  }

  if (status !== null && !STATUS.has(status)) {
    return { ok: false, error: "invalid_status" };
  }

  if (approval_state !== null && !APPROVAL.has(approval_state)) {
    return { ok: false, error: "invalid_approval_state" };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { ok: false, error: "supabase_not_configured" };
  }

  const label = (actorLabel?.trim() || "Internal").slice(0, 200);

  const { data, error } = await supabase.rpc("admin_update_task", {
    p_task_id: id,
    p_actor_label: label,
    p_status: status,
    p_approval_state: approval_state,
  });

  if (error) {
    console.error("[updateAdminTask]", error);
    return { ok: false, error: error.message };
  }

  const payload = data as { ok?: boolean; error?: string } | null;
  if (!payload?.ok) {
    return { ok: false, error: payload?.error ?? "not_found" };
  }

  await revalidateTaskSurfaces();

  return { ok: true };
}

/**
 * Queue a demo/ real worker run for this task (each call uses a fresh idempotency key).
 */
export async function enqueueAgentRunFromAdmin(taskId: string): Promise<EnqueueAgentRunActionResult> {
  const id = parseTaskId(taskId);
  if (!id) {
    return { ok: false, error: "invalid_id" };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { ok: false, error: "supabase_not_configured" };
  }

  const result = await enqueueAgentRunForTask(supabase, id, {
    idempotencyKey: `admin-ui-${Date.now()}`,
    enqueuedVia: "admin_task_row",
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  await revalidateTaskSurfaces();

  return { ok: true, runId: result.runId, deduped: result.deduped };
}
