import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { formatAgentRunDuration, formatAgentRunMetricsSummary } from "@/lib/db/admin/agent-run-format";
import type { DataSource } from "@/lib/db/admin/labels";
import type { AgentRunListRow } from "@/lib/admin/mock/agent-runs";
import { mockAgentRuns } from "@/lib/admin/mock/agent-runs";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fmtTs(ts: string | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 16).replace("T", " ");
}

function statusUi(db: string): AgentRunListRow["status"] {
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

export type AgentRunDetail = {
  id: string;
  taskId: string;
  runKey: string;
  statusDb: string;
  statusUi: AgentRunListRow["status"];
  taskTypeSnapshot: string | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string;
  finishedAt: string;
  wallDuration: string;
  metricsSummary: string;
  outputRef: unknown;
  taskTitle: string;
  engagementId: string;
  clientName: string;
};

export type AgentRunDetailResult =
  | { source: "not_found" }
  | { source: DataSource; detail: AgentRunDetail };

function mockOutputRef(id: string): unknown {
  if (id === "0000000c-0000-4000-8000-000000000001") {
    return {
      tool: "fetch_page_jsonld",
      request_url: "https://mit.edu/",
      final_url: "https://web.mit.edu/",
      http_status: 200,
      jsonld_block_count: 0,
      types: [],
      metrics: {
        worker: "agent-worker-demo",
        stub: false,
        wall_ms: {
          fetch_page_jsonld_ms: 1200,
          consult_brief_ms: 3400,
          total_processing_ms: 5200,
        },
        llm_tokens: { prompt: 220, completion: 392, total: 612 },
      },
      llm: {
        tool: "consult_brief",
        model: "gpt-4o-mini",
        brief:
          "- No JSON-LD blocks detected on the fetched MIT homepage response in this snapshot.\n- Visibility from structured data alone cannot be confirmed without richer on-page markup.\n- Recommend validating the live HTML / rendering path used by crawlers.",
        usage: { prompt_tokens: 220, completion_tokens: 392, total_tokens: 612 },
      },
    };
  }
  return { enqueued_via: "admin_task_row" };
}

function buildMockDetail(row: AgentRunListRow): AgentRunDetail {
  return {
    id: row.id,
    taskId: row.taskId,
    runKey: `${row.taskId}:mock-detail`,
    statusDb: row.statusDb,
    statusUi: row.status,
    taskTypeSnapshot: row.taskType,
    errorMessage: row.errorSnippet,
    createdAt: row.createdAt,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    wallDuration: row.wallDuration,
    metricsSummary: row.metricsSummary,
    outputRef: mockOutputRef(row.id),
    taskTitle: row.taskTitle,
    engagementId: row.engagementId,
    clientName: row.client,
  };
}

export async function getAdminAgentRunDetail(runIdRaw: string): Promise<AgentRunDetailResult> {
  const runId = runIdRaw?.trim() ?? "";
  if (!uuidRe.test(runId)) {
    return { source: "not_found" };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    const row = mockAgentRuns.find((r) => r.id === runId);
    if (!row) {
      return { source: "not_found" };
    }
    return { source: "mock", detail: buildMockDetail(row) };
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
    .eq("id", runId)
    .maybeSingle();

  if (error) {
    console.error("[admin] agent_run detail failed", error);
    const row = mockAgentRuns.find((r) => r.id === runId);
    if (!row) {
      return { source: "not_found" };
    }
    return { source: "mock", detail: buildMockDetail(row) };
  }

  if (!data) {
    return { source: "not_found" };
  }

  const task = data.tasks as unknown as {
    title: string;
    engagement_id: string;
    engagements: { client_accounts: { name: string } | null } | null;
  } | null;

  const st = (data.status as string) ?? "pending";

  const detail: AgentRunDetail = {
    id: data.id as string,
    taskId: data.task_id as string,
    runKey: data.run_key as string,
    statusDb: st,
    statusUi: statusUi(st),
    taskTypeSnapshot: (data.task_type_snapshot as string | null) ?? null,
    errorMessage: (data.error_message as string | null) ?? null,
    createdAt: fmtTs(data.created_at as string),
    startedAt: fmtTs(data.started_at as string | null),
    finishedAt: fmtTs(data.finished_at as string | null),
    wallDuration: formatAgentRunDuration(data.started_at as string | null, data.finished_at as string | null),
    metricsSummary: formatAgentRunMetricsSummary(data.output_ref),
    outputRef: data.output_ref,
    taskTitle: task?.title ?? "—",
    engagementId: task?.engagement_id ?? "",
    clientName: task?.engagements?.client_accounts?.name ?? "—",
  };

  return { source: "database", detail };
}
