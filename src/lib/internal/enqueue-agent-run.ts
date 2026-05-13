import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EnqueueAgentRunOk = {
  ok: true;
  deduped: boolean;
  runId: string;
  status: string;
  runKey: string;
};

export type EnqueueAgentRunErr = { ok: false; error: string };

export type EnqueueAgentRunResult = EnqueueAgentRunOk | EnqueueAgentRunErr;

/**
 * Insert a `pending` row in `agent_runs` (idempotent per `run_key`).
 */
export async function enqueueAgentRunForTask(
  supabase: SupabaseClient,
  taskIdRaw: string,
  options?: {
    idempotencyKey?: string;
    enqueuedVia?: string;
  },
): Promise<EnqueueAgentRunResult> {
  const taskId = taskIdRaw?.trim() ?? "";
  if (!uuidRe.test(taskId)) {
    return { ok: false, error: "invalid_task_id" };
  }

  const idempotencyKey =
    typeof options?.idempotencyKey === "string" && options.idempotencyKey.trim()
      ? options.idempotencyKey.trim().slice(0, 200)
      : "default";

  const { data: task, error: taskErr } = await supabase
    .from("tasks")
    .select("id, task_type, status")
    .eq("id", taskId)
    .maybeSingle();

  if (taskErr) {
    console.error("[enqueueAgentRunForTask] task lookup", taskErr);
    return { ok: false, error: "task_lookup_failed" };
  }
  if (!task) {
    return { ok: false, error: "task_not_found" };
  }
  if ((task.status as string) === "cancelled") {
    return { ok: false, error: "task_cancelled" };
  }

  const runKey = `${taskId}:${idempotencyKey}`;

  const { data: existing } = await supabase.from("agent_runs").select("id, status, run_key").eq("run_key", runKey).maybeSingle();

  if (existing) {
    return {
      ok: true,
      deduped: true,
      runId: existing.id,
      status: existing.status as string,
      runKey: existing.run_key as string,
    };
  }

  const enqueuedVia = options?.enqueuedVia ?? "enqueueAgentRunForTask";

  const { data: inserted, error: insErr } = await supabase
    .from("agent_runs")
    .insert({
      task_id: taskId,
      run_key: runKey,
      status: "pending",
      task_type_snapshot: task.task_type as string,
      output_ref: { enqueued_via: enqueuedVia },
    })
    .select("id, status, run_key")
    .single();

  if (insErr) {
    if (insErr.code === "23505") {
      const { data: raced } = await supabase.from("agent_runs").select("id, status, run_key").eq("run_key", runKey).maybeSingle();
      if (raced) {
        return {
          ok: true,
          deduped: true,
          runId: raced.id,
          status: raced.status as string,
          runKey: raced.run_key as string,
        };
      }
    }
    if (insErr.code === "42P01" || insErr.message?.includes("agent_runs")) {
      return { ok: false, error: "agent_runs_table_missing" };
    }
    console.error("[enqueueAgentRunForTask] insert", insErr);
    return { ok: false, error: "insert_failed" };
  }

  return {
    ok: true,
    deduped: false,
    runId: inserted.id,
    status: inserted.status as string,
    runKey: inserted.run_key as string,
  };
}
