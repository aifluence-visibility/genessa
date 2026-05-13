import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { toDisplayDate, toDisplaySector } from "@/lib/db/admin/format";
import { formatAgentRunMetricsSummary } from "@/lib/db/admin/agent-run-format";
import type { DataSource } from "@/lib/db/admin/labels";
import { mapLabel, taskApprovalLabel, taskPriorityLabel, taskStatusLabel } from "@/lib/db/admin/labels";
import type { TaskRow } from "@/lib/admin/mock/tasks";
import type { AgentRunListRow } from "@/lib/admin/mock/agent-runs";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function runStatusUi(db: string): AgentRunListRow["status"] {
  switch (db.toLowerCase()) {
    case "pending":
      return "Pending";
    case "running":
      return "Running";
    case "succeeded":
      return "Succeeded";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Pending";
  }
}

function shortRunKey(key: string, max = 36): string {
  const k = key?.trim() ?? "";
  if (k.length <= max) return k;
  return `…${k.slice(-(max - 1))}`;
}

function fmtRunTs(ts: string | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 16).replace("T", " ");
}

export type TaskDetail = {
  id: string;
  title: string;
  taskType: string;
  sector: string;
  priorityUi: TaskRow["priority"];
  statusUi: TaskRow["status"];
  approvalUi: TaskRow["approval"];
  statusDb: string;
  approvalDb: string;
  assigneeLabel: string | null;
  outputSummary: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
  engagementId: string;
  clientName: string;
};

export type TaskAgentRunRow = {
  id: string;
  runKeyShort: string;
  statusUi: AgentRunListRow["status"];
  statusDb: string;
  createdAt: string;
  metricsSummary: string;
};

export type TaskDetailResult =
  | { source: "not_found" }
  | { source: DataSource; detail: TaskDetail; runs: TaskAgentRunRow[] };

export async function getAdminTaskDetail(taskIdRaw: string): Promise<TaskDetailResult> {
  const taskId = taskIdRaw?.trim() ?? "";
  if (!taskId) {
    return { source: "not_found" };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    const { mockTasks } = await import("@/lib/admin/mock/tasks");
    const row = mockTasks.find((t) => t.id === taskId);
    if (!row) {
      return { source: "not_found" };
    }
    const engagementId = row.mockEngagementId ?? "";
    const clientName = row.mockClientName ?? "—";
    return {
      source: "mock",
      detail: {
        id: row.id,
        title: row.title,
        taskType: row.taskType,
        sector: row.sector,
        priorityUi: row.priority,
        statusUi: row.status,
        approvalUi: row.approval,
        statusDb: row.statusDb ?? row.status.toLowerCase().replace(/\s+/g, "_"),
        approvalDb: row.approvalDb ?? "not_required",
        assigneeLabel: row.assignedAgent,
        outputSummary: row.output === "—" ? null : row.output,
        metadata: {},
        createdAt: "—",
        updatedAt: "—",
        engagementId,
        clientName,
      },
      runs: [],
    };
  }

  if (!uuidRe.test(taskId)) {
    return { source: "not_found" };
  }

  const { data: task, error: taskErr } = await supabase
    .from("tasks")
    .select(
      `
      id,
      title,
      task_type,
      sector,
      priority,
      status,
      approval_state,
      output_summary,
      metadata,
      created_at,
      updated_at,
      assignee_label,
      engagement_id,
      engagements (
        client_accounts ( name )
      )
    `,
    )
    .eq("id", taskId)
    .maybeSingle();

  if (taskErr) {
    console.error("[admin] task detail failed", taskErr);
    return { source: "not_found" };
  }
  if (!task) {
    return { source: "not_found" };
  }

  const engagement = task.engagements as unknown as {
    client_accounts: { name: string } | null;
  } | null;

  const detail: TaskDetail = {
    id: task.id as string,
    title: task.title as string,
    taskType: (task.task_type as string) ?? "—",
    sector: toDisplaySector(task.sector as string | null),
    priorityUi: mapLabel(taskPriorityLabel, task.priority, task.priority) as TaskRow["priority"],
    statusUi: mapLabel(taskStatusLabel, task.status, task.status) as TaskRow["status"],
    approvalUi: mapLabel(taskApprovalLabel, task.approval_state, task.approval_state) as TaskRow["approval"],
    statusDb: task.status as string,
    approvalDb: task.approval_state as string,
    assigneeLabel: (task.assignee_label as string | null) ?? null,
    outputSummary: (task.output_summary as string | null) ?? null,
    metadata: task.metadata ?? {},
    createdAt: toDisplayDate(task.created_at as string),
    updatedAt: toDisplayDate(task.updated_at as string),
    engagementId: task.engagement_id as string,
    clientName: engagement?.client_accounts?.name ?? "—",
  };

  const { data: runRows, error: runsErr } = await supabase
    .from("agent_runs")
    .select("id, run_key, status, created_at, output_ref")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (runsErr) {
    console.error("[admin] task detail agent_runs failed", runsErr);
  }

  const runs: TaskAgentRunRow[] = (runRows ?? []).map((r) => {
    const st = (r.status as string) ?? "pending";
    return {
      id: r.id as string,
      runKeyShort: shortRunKey(r.run_key as string),
      statusUi: runStatusUi(st),
      statusDb: st,
      createdAt: fmtRunTs(r.created_at as string),
      metricsSummary: formatAgentRunMetricsSummary(r.output_ref),
    };
  });

  return { source: "database", detail, runs };
}
