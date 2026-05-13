import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import type { TaskRow } from "@/lib/admin/mock/tasks";
import { TaskRowActions } from "@/components/admin/tasks/task-row-actions";
import { getAdminTasks } from "@/lib/db/admin/tasks";

export const metadata: Metadata = {
  title: "Tasks",
};

type PageProps = {
  searchParams?: Promise<{ engagement?: string }>;
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

export default async function AdminTasksPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const engagementRaw = sp.engagement?.trim() || "";
  const { source, rows } = await getAdminTasks(engagementRaw || null);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Tasks"
        description={
          engagementRaw ? (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Operational work units spanning sectors, assignments, and approval posture.</span>
              <span className="text-[var(--ink-500)]">·</span>
              <span className="text-[var(--ink-600)]">Filtered to one engagement.</span>
              <Link href={`/admin/engagements/${engagementRaw}`} className="text-[var(--genessa-blue)] hover:underline">
                Open engagement
              </Link>
              <span className="text-[var(--ink-500)]">·</span>
              <Link href="/admin/tasks" className="text-[var(--genessa-blue)] hover:underline">
                Clear filter
              </Link>
            </span>
          ) : (
            "Operational work units spanning sectors, assignments, and approval posture."
          )
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
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--ink-500)]">No tasks yet.</p>
      ) : (
        <DataTable<TaskRow>
          columns={[
            {
              key: "title",
              header: "Task",
              className: "min-w-[240px]",
              cell: (row) => (
                <Link href={`/admin/tasks/${row.id}`} className="font-medium text-[var(--genessa-blue)] hover:underline">
                  {row.title}
                </Link>
              ),
            },
            { key: "taskType", header: "Type" },
            { key: "sector", header: "Sector" },
            {
              key: "priority",
              header: "Priority",
              cell: (row) => priorityBadge(row.priority),
            },
            {
              key: "status",
              header: "Status",
              cell: (row) => taskStatusBadge(row.status),
            },
            { key: "assignedAgent", header: "Assigned", className: "min-w-[200px]" },
            { key: "output", header: "Output", className: "min-w-[180px]" },
            {
              key: "approval",
              header: "Approval",
              cell: (row) => approvalBadge(row.approval),
            },
            {
              key: "actions",
              header: "Update",
              className: "min-w-[280px]",
              cell: (row) => (
                <TaskRowActions
                  key={`${row.id}-${row.statusDb ?? ""}-${row.approvalDb ?? ""}`}
                  row={row}
                  canMutate={source === "database"}
                />
              ),
            },
          ]}
          rows={rows}
          getRowKey={(row) => row.id}
        />
      )}
    </div>
  );
}
