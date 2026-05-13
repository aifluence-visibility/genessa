import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import type { SprintRow } from "@/lib/admin/mock/sprints";
import { getAdminSprints } from "@/lib/db/admin/sprints";

export const metadata: Metadata = {
  title: "Sprints",
};

type PageProps = {
  searchParams?: Promise<{ engagement?: string }>;
};

function sprintStatusBadge(s: SprintRow["status"]) {
  switch (s) {
    case "Active":
      return <StatusBadge variant="success">{s}</StatusBadge>;
    case "Planned":
      return <StatusBadge variant="info">{s}</StatusBadge>;
    case "Completed":
      return <StatusBadge variant="neutral">{s}</StatusBadge>;
    default:
      return <StatusBadge variant="neutral">{s}</StatusBadge>;
  }
}

export default async function AdminSprintsPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const engagementRaw = sp.engagement?.trim() || "";
  const { source, rows } = await getAdminSprints(engagementRaw || null);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Sprints"
        description={
          engagementRaw ? (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Time-boxed work windows, goals, and status — tasks may link to an active sprint.</span>
              <span className="text-[var(--ink-500)]">·</span>
              <span className="text-[var(--ink-600)]">Filtered to one engagement.</span>
              <Link href={`/admin/engagements/${engagementRaw}`} className="text-[var(--genessa-blue)] hover:underline">
                Open engagement
              </Link>
              <span className="text-[var(--ink-500)]">·</span>
              <Link href="/admin/sprints" className="text-[var(--genessa-blue)] hover:underline">
                Clear filter
              </Link>
            </span>
          ) : (
            "Time-boxed work windows, goals, and status — tasks may link to an active sprint."
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
        <p className="text-sm text-[var(--ink-500)]">No sprints yet.</p>
      ) : (
        <DataTable<SprintRow>
          columns={[
            {
              key: "client",
              header: "Client",
              cell: (row) => (
                <Link
                  href={`/admin/engagements/${row.engagementId}`}
                  className="font-medium text-[var(--genessa-blue)] hover:underline"
                >
                  {row.client}
                </Link>
              ),
            },
            { key: "label", header: "Sprint", className: "min-w-[200px]" },
            {
              key: "status",
              header: "Status",
              cell: (row) => sprintStatusBadge(row.status),
            },
            { key: "period", header: "Period", className: "whitespace-nowrap tabular-nums" },
            { key: "goals", header: "Goals", className: "min-w-[180px]" },
            { key: "updatedAt", header: "Updated" },
          ]}
          rows={rows}
          getRowKey={(row) => row.id}
        />
      )}
    </div>
  );
}
