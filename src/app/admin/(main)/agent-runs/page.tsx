import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import type { AgentRunListRow } from "@/lib/admin/mock/agent-runs";
import { getAdminAgentRuns } from "@/lib/db/admin/agent-runs-list";

export const metadata: Metadata = {
  title: "Agent runs",
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "running", label: "Running" },
  { value: "succeeded", label: "Succeeded" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

type PageProps = {
  searchParams?: Promise<{ engagement?: string; status?: string; task?: string }>;
};

function runStatusBadge(s: AgentRunListRow["status"]) {
  switch (s) {
    case "Succeeded":
      return <StatusBadge variant="success">{s}</StatusBadge>;
    case "Running":
      return <StatusBadge variant="warning">{s}</StatusBadge>;
    case "Pending":
      return <StatusBadge variant="info">{s}</StatusBadge>;
    case "Failed":
      return <StatusBadge variant="danger">{s}</StatusBadge>;
    case "Cancelled":
      return <StatusBadge variant="neutral">{s}</StatusBadge>;
    default:
      return <StatusBadge variant="neutral">{s}</StatusBadge>;
  }
}

export default async function AdminAgentRunsPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const engagementRaw = sp.engagement?.trim() || "";
  const statusRaw = sp.status?.trim().toLowerCase() || "";
  const taskRaw = sp.task?.trim() || "";

  const { source, rows } = await getAdminAgentRuns({
    engagementId: engagementRaw || null,
    status: statusRaw || null,
    taskId: taskRaw || null,
  });

  const formAction = "/admin/agent-runs";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Agent runs"
        description="Asynchronous executions queued for tasks (`agent_runs`). Wall = clock time from started→finished; Metrics = `output_ref.metrics` (fetch/LLM ms, tokens). Filter by engagement, status, or task id."
        actions={
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--border)] ${
              source === "database" ? "bg-emerald-50 text-emerald-900" : "bg-[var(--ink-0)] text-[var(--ink-600)]"
            }`}
          >
            {source === "database" ? "Live database" : "Mock / offline data"}
          </span>
        }
      />

      <form
        method="get"
        action={formAction}
        className="flex flex-wrap items-end gap-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] p-4"
      >
        <label className="flex min-w-[200px] flex-col gap-1 text-xs font-medium text-[var(--ink-600)]">
          Engagement id
          <input
            name="engagement"
            defaultValue={engagementRaw}
            placeholder="UUID (optional)"
            className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 py-2 text-sm text-[var(--ink-900)]"
          />
        </label>
        <label className="flex min-w-[160px] flex-col gap-1 text-xs font-medium text-[var(--ink-600)]">
          Status
          <select
            name="status"
            defaultValue={statusRaw}
            className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 py-2 text-sm text-[var(--ink-900)]"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[220px] flex-col gap-1 text-xs font-medium text-[var(--ink-600)]">
          Task id
          <input
            name="task"
            defaultValue={taskRaw}
            placeholder="UUID (optional)"
            className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 py-2 text-sm text-[var(--ink-900)]"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-[var(--r-md)] bg-[var(--ink-900)] px-4 text-sm font-medium text-[var(--ink-0)] hover:opacity-95"
          >
            Apply
          </button>
          <Link
            href="/admin/agent-runs"
            className="inline-flex h-9 items-center justify-center rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-4 text-sm font-medium text-[var(--ink-800)] hover:bg-[var(--ink-50)]"
          >
            Reset
          </Link>
        </div>
      </form>

      {rows.length === 0 ? (
        <p className="text-sm text-[var(--ink-500)]">No agent runs match these filters.</p>
      ) : (
        <DataTable<AgentRunListRow>
          columns={[
            {
              key: "id",
              header: "Run",
              cell: (r) => (
                <Link
                  href={`/admin/agent-runs/${r.id}`}
                  className="font-mono text-xs text-[var(--genessa-blue)] hover:underline"
                  title={r.id}
                >
                  {r.id.slice(0, 8)}…
                </Link>
              ),
            },
            {
              key: "client",
              header: "Client",
              cell: (r) =>
                r.engagementId ? (
                  <Link href={`/admin/engagements/${r.engagementId}`} className="text-[var(--genessa-blue)] hover:underline">
                    {r.client}
                  </Link>
                ) : (
                  r.client
                ),
            },
            {
              key: "taskTitle",
              header: "Task",
              className: "min-w-[200px]",
              cell: (r) => (
                <span className="line-clamp-2 text-sm" title={r.taskTitle}>
                  {r.taskTitle}
                </span>
              ),
            },
            { key: "taskType", header: "Type" },
            {
              key: "status",
              header: "Status",
              cell: (r) => runStatusBadge(r.status),
            },
            { key: "createdAt", header: "Created", className: "whitespace-nowrap tabular-nums text-xs" },
            { key: "startedAt", header: "Started", className: "whitespace-nowrap tabular-nums text-xs" },
            { key: "finishedAt", header: "Finished", className: "whitespace-nowrap tabular-nums text-xs" },
            {
              key: "wallDuration",
              header: "Wall",
              className: "whitespace-nowrap tabular-nums text-xs text-[var(--ink-600)]",
            },
            {
              key: "metricsSummary",
              header: "Metrics",
              className: "max-w-[200px] truncate text-xs text-[var(--ink-600)]",
              cell: (r) => (
                <span title={r.metricsSummary} className="tabular-nums">
                  {r.metricsSummary}
                </span>
              ),
            },
            {
              key: "runKeyShort",
              header: "Run key",
              className: "max-w-[140px] truncate font-mono text-xs text-[var(--ink-600)]",
            },
            {
              key: "errorSnippet",
              header: "Error",
              className: "max-w-[180px] text-xs text-red-700",
              cell: (r) => r.errorSnippet ?? "—",
            },
          ]}
          rows={rows}
          getRowKey={(r) => r.id}
        />
      )}
    </div>
  );
}
