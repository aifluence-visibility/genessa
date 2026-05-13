import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { DataTable } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { getAdminTaskDetail, type TaskAgentRunRow } from "@/lib/db/admin/task-detail";
import type { TaskRow } from "@/lib/admin/mock/tasks";
import type { AgentRunListRow } from "@/lib/admin/mock/agent-runs";

type PageProps = {
  params: Promise<{ taskId: string }>;
};

function priorityBadge(p: TaskRow["priority"]) {
  switch (p) {
    case "High":
      return <StatusBadge variant="danger">{p}</StatusBadge>;
    case "Medium":
      return <StatusBadge variant="warning">{p}</StatusBadge>;
    case "Low":
    default:
      return <StatusBadge variant="neutral">{p}</StatusBadge>;
  }
}

function taskStatusBadge(s: TaskRow["status"]) {
  switch (s) {
    case "In progress":
      return <StatusBadge variant="info">{s}</StatusBadge>;
    case "Blocked":
      return <StatusBadge variant="warning">{s}</StatusBadge>;
    case "Done":
      return <StatusBadge variant="success">{s}</StatusBadge>;
    case "Cancelled":
      return <StatusBadge variant="danger">{s}</StatusBadge>;
    case "Todo":
    default:
      return <StatusBadge variant="neutral">{s}</StatusBadge>;
  }
}

function approvalBadge(a: TaskRow["approval"]) {
  switch (a) {
    case "Pending":
      return <StatusBadge variant="warning">{a}</StatusBadge>;
    case "Approved":
      return <StatusBadge variant="success">{a}</StatusBadge>;
    case "Rejected":
      return <StatusBadge variant="danger">{a}</StatusBadge>;
    case "Not required":
    default:
      return <StatusBadge variant="neutral">{a}</StatusBadge>;
  }
}

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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { taskId } = await params;
  const result = await getAdminTaskDetail(taskId);
  if (result.source === "not_found") {
    return { title: "Task" };
  }
  return { title: `${result.detail.title} · Task` };
}

export default async function AdminTaskDetailPage({ params }: PageProps) {
  const { taskId } = await params;
  const result = await getAdminTaskDetail(taskId);
  if (result.source === "not_found") {
    notFound();
  }

  const { source, detail, runs } = result;

  const linkClass =
    "inline-flex h-9 items-center justify-center rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 text-sm font-medium text-[var(--ink-800)] hover:bg-[var(--ink-50)]";

  let metadataJson: string;
  try {
    metadataJson = JSON.stringify(detail.metadata ?? {}, null, 2);
  } catch {
    metadataJson = "{}";
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title={detail.title}
        description={
          <span className="text-[var(--ink-600)]">
            {detail.taskType}
            <span className="mx-2 text-[var(--ink-300)]">·</span>
            {detail.sector}
          </span>
        }
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

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/tasks" className={linkClass}>
          ← All tasks
        </Link>
        {detail.engagementId ? (
          <Link href={`/admin/engagements/${detail.engagementId}`} className={linkClass}>
            Engagement
          </Link>
        ) : null}
        {detail.engagementId ? (
          <Link href={`/admin/agent-runs?task=${detail.id}`} className={linkClass}>
            Agent runs (filtered)
          </Link>
        ) : (
          <Link href="/admin/agent-runs" className={linkClass}>
            Agent runs
          </Link>
        )}
      </div>

      <Panel>
        <h2 className="text-sm font-semibold text-[var(--ink-900)]">Summary</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Task id</dt>
            <dd className="mt-0.5 break-all font-mono text-xs text-[var(--ink-800)]">{detail.id}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Client</dt>
            <dd className="mt-0.5 text-[var(--ink-800)]">
              {detail.engagementId ? (
                <Link href={`/admin/engagements/${detail.engagementId}`} className="text-[var(--genessa-blue)] hover:underline">
                  {detail.clientName}
                </Link>
              ) : (
                detail.clientName
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Assignee</dt>
            <dd className="mt-0.5 text-[var(--ink-800)]">{detail.assigneeLabel ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Priority</dt>
            <dd className="mt-0.5">{priorityBadge(detail.priorityUi)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Status</dt>
            <dd className="mt-0.5">{taskStatusBadge(detail.statusUi)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Approval</dt>
            <dd className="mt-0.5">{approvalBadge(detail.approvalUi)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Created</dt>
            <dd className="mt-0.5 tabular-nums text-[var(--ink-800)]">{detail.createdAt}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Updated</dt>
            <dd className="mt-0.5 tabular-nums text-[var(--ink-800)]">{detail.updatedAt}</dd>
          </div>
        </dl>
      </Panel>

      <Panel>
        <h2 className="text-sm font-semibold text-[var(--ink-900)]">Output summary</h2>
        {detail.outputSummary ? (
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-[var(--r-md)] bg-[var(--ink-50)] p-3 text-sm text-[var(--ink-800)]">
            {detail.outputSummary}
          </pre>
        ) : (
          <p className="mt-3 text-sm text-[var(--ink-500)]">No output summary yet.</p>
        )}
      </Panel>

      <Panel padding="p-0">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--ink-900)]">Agent runs</h2>
          <p className="mt-1 text-xs text-[var(--ink-500)]">Latest worker executions for this task (newest first).</p>
        </div>
        {runs.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[var(--ink-500)]">No agent runs yet. Queue one from the tasks table.</p>
        ) : (
          <DataTable<TaskAgentRunRow>
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
                key: "statusUi",
                header: "Status",
                cell: (r) => runStatusBadge(r.statusUi),
              },
              {
                key: "runKeyShort",
                header: "Run key",
                className: "max-w-[140px] truncate font-mono text-xs text-[var(--ink-600)]",
              },
              {
                key: "createdAt",
                header: "Created",
                className: "whitespace-nowrap tabular-nums text-xs",
              },
              {
                key: "metricsSummary",
                header: "Metrics",
                className: "max-w-[180px] truncate text-xs text-[var(--ink-600)]",
                cell: (r) => (
                  <span title={r.metricsSummary} className="tabular-nums">
                    {r.metricsSummary}
                  </span>
                ),
              },
            ]}
            rows={runs}
            getRowKey={(r) => r.id}
          />
        )}
      </Panel>

      <Panel padding="p-0">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--ink-900)]">metadata (JSON)</h2>
        </div>
        <pre className="max-h-[min(40vh,320px)] overflow-auto p-4 text-xs leading-relaxed text-[var(--ink-800)]">
          {metadataJson}
        </pre>
      </Panel>
    </div>
  );
}
