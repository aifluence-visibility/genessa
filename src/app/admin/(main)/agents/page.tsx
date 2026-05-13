import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import type { AgentRow } from "@/lib/admin/mock/agents";
import { getAdminAgents } from "@/lib/db/admin/agents";

export const metadata: Metadata = {
  title: "Agents",
};

type PageProps = {
  searchParams?: Promise<{ engagement?: string }>;
};

export default async function AdminAgentsPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const engagementRaw = sp.engagement?.trim() || "";
  const { source, rows } = await getAdminAgents(engagementRaw || null);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Agents"
        description={
          engagementRaw ? (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Workload rolled up from task assignees (`assignee_label` or linked `public.users`).</span>
              <span className="text-[var(--ink-500)]">·</span>
              <span className="text-[var(--ink-600)]">Filtered to one engagement.</span>
              <Link href={`/admin/engagements/${engagementRaw}`} className="text-[var(--genessa-blue)] hover:underline">
                Open engagement
              </Link>
              <span className="text-[var(--ink-500)]">·</span>
              <Link href="/admin/agents" className="text-[var(--genessa-blue)] hover:underline">
                Clear filter
              </Link>
            </span>
          ) : (
            "Workload rolled up from task assignees (`assignee_label` or linked internal users). Not a separate registry yet — Stage 1 snapshot."
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
        <p className="text-sm text-[var(--ink-500)]">No assignee workload yet.</p>
      ) : (
        <DataTable<AgentRow>
          columns={[
            {
              key: "name",
              header: "Assignee",
              className: "min-w-[200px]",
              cell: (row) => (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-[var(--ink-900)]">{row.name}</span>
                  {row.linkedUser ? (
                    <StatusBadge variant="info">User link</StatusBadge>
                  ) : row.name !== "Unassigned" ? (
                    <StatusBadge variant="neutral">Label</StatusBadge>
                  ) : null}
                </div>
              ),
            },
            {
              key: "active",
              header: "Active",
              cell: (row) => <span className="tabular-nums font-semibold">{row.active}</span>,
            },
            {
              key: "done",
              header: "Done",
              cell: (row) => <span className="tabular-nums">{row.done}</span>,
            },
            {
              key: "cancelled",
              header: "Cancelled",
              cell: (row) => <span className="tabular-nums text-[var(--ink-500)]">{row.cancelled}</span>,
            },
            {
              key: "total",
              header: "Total",
              cell: (row) => <span className="tabular-nums">{row.total}</span>,
            },
            { key: "recentTitle", header: "Latest task", className: "min-w-[200px]" },
            { key: "updatedAt", header: "Last updated" },
          ]}
          rows={rows}
          getRowKey={(row) => row.id}
        />
      )}
    </div>
  );
}
