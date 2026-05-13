import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { formatAgentRunDuration, formatAgentRunMetricsSummary } from "@/lib/db/admin/agent-run-format";
import type { DataSource } from "@/lib/db/admin/labels";
import type { AgentRunListRow } from "@/lib/admin/mock/agent-runs";
import { mockAgentRuns } from "@/lib/admin/mock/agent-runs";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RUN_STATUSES = new Set(["pending", "running", "succeeded", "failed", "cancelled"]);

function fmtTs(ts: string | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 16).replace("T", " ");
}

function statusUi(db: string): AgentRunListRow["status"] {
  switch (db) {
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

export type AdminAgentRunsFilters = {
  engagementId?: string | null;
  status?: string | null;
  taskId?: string | null;
};

export async function getAdminAgentRuns(
  filters: AdminAgentRunsFilters = {},
): Promise<{ source: DataSource; rows: AgentRunListRow[] }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { source: "mock", rows: filterMockRows(filters) };
  }

  const { data, error } = await supabase
    .from("agent_runs")
    .select(
      `
      id,
      task_id,
      run_key,
      status,
      task_type_snapshot,
      error_message,
      created_at,
      started_at,
      finished_at,
      output_ref,
      tasks (
        title,
        engagement_id,
        engagements (
          client_accounts ( name )
        )
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(400);

  if (error) {
    console.error("[admin] agent_runs list failed", error);
    return { source: "mock", rows: filterMockRows(filters) };
  }

  let rows: AgentRunListRow[] = (data ?? []).map((row) => {
    const task = row.tasks as unknown as {
      title: string;
      engagement_id: string;
      engagements: { client_accounts: { name: string } | null } | null;
    } | null;
    const client = task?.engagements?.client_accounts?.name ?? "—";
    const engagementId = task?.engagement_id ?? "";
    const title = task?.title ?? "—";
    const st = (row.status as string) ?? "pending";
    const err = row.error_message as string | null;
    return {
      id: row.id as string,
      taskId: row.task_id as string,
      engagementId,
      client,
      taskTitle: title,
      taskType: (row.task_type_snapshot as string | null) ?? "—",
      status: statusUi(st),
      statusDb: st,
      runKeyShort: shortRunKey(row.run_key as string),
      errorSnippet: err ? err.slice(0, 120) : null,
      createdAt: fmtTs(row.created_at as string),
      startedAt: fmtTs(row.started_at as string | null),
      finishedAt: fmtTs(row.finished_at as string | null),
      wallDuration: formatAgentRunDuration(row.started_at as string | null, row.finished_at as string | null),
      metricsSummary: formatAgentRunMetricsSummary(row.output_ref),
    };
  });

  rows = applyFilters(rows, filters);

  return { source: "database", rows };
}

function applyFilters(rows: AgentRunListRow[], filters: AdminAgentRunsFilters): AgentRunListRow[] {
  let out = rows;
  const eng = filters.engagementId?.trim() ?? "";
  if (eng && uuidRe.test(eng)) {
    out = out.filter((r) => r.engagementId === eng);
  }
  const st = filters.status?.trim().toLowerCase() ?? "";
  if (st && RUN_STATUSES.has(st)) {
    out = out.filter((r) => r.statusDb === st);
  }
  const tid = filters.taskId?.trim() ?? "";
  if (tid && uuidRe.test(tid)) {
    out = out.filter((r) => r.taskId === tid);
  }
  return out;
}

function filterMockRows(filters: AdminAgentRunsFilters): AgentRunListRow[] {
  return applyFilters(mockAgentRuns.map((r) => ({ ...r })), filters);
}
