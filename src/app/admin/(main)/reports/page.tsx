import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { ReportRowActions } from "@/components/admin/reports/report-row-actions";
import type { ReportRow } from "@/lib/admin/mock/reports";
import { getAdminReports } from "@/lib/db/admin/reports";

export const metadata: Metadata = {
  title: "Reports",
};

type PageProps = {
  searchParams?: Promise<{ engagement?: string }>;
};

function reportTypeBadge(t: ReportRow["type"]) {
  switch (t) {
    case "Audit":
      return <StatusBadge variant="info">{t}</StatusBadge>;
    case "Weekly":
      return <StatusBadge variant="neutral">{t}</StatusBadge>;
    case "Executive":
      return <StatusBadge variant="warning">{t}</StatusBadge>;
    case "Deliverable":
    default:
      return <StatusBadge variant="success">{t}</StatusBadge>;
  }
}

function reportStatusBadge(s: ReportRow["status"]) {
  switch (s) {
    case "Delivered":
    case "Client ready":
      return <StatusBadge variant="success">{s}</StatusBadge>;
    case "Internal review":
      return <StatusBadge variant="warning">{s}</StatusBadge>;
    case "Archived":
      return <StatusBadge variant="neutral">{s}</StatusBadge>;
    case "Draft":
    default:
      return <StatusBadge variant="neutral">{s}</StatusBadge>;
  }
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const engagementRaw = sp.engagement?.trim() || "";
  const { source, rows } = await getAdminReports(engagementRaw || null);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Reports"
        description={
          engagementRaw ? (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Audit outputs, cadence summaries, and executive narratives staged for client delivery.</span>
              <span className="text-[var(--ink-500)]">·</span>
              <span className="text-[var(--ink-600)]">Filtered to one engagement.</span>
              <Link href={`/admin/engagements/${engagementRaw}`} className="text-[var(--genessa-blue)] hover:underline">
                Open engagement
              </Link>
              <span className="text-[var(--ink-500)]">·</span>
              <Link href="/admin/reports" className="text-[var(--genessa-blue)] hover:underline">
                Clear filter
              </Link>
            </span>
          ) : (
            "Audit outputs, cadence summaries, and executive narratives staged for client delivery."
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
        <p className="text-sm text-[var(--ink-500)]">No reports yet.</p>
      ) : (
        <DataTable<ReportRow>
          columns={[
            { key: "title", header: "Title", className: "min-w-[260px]" },
            { key: "client", header: "Client" },
            {
              key: "type",
              header: "Type",
              cell: (row) => reportTypeBadge(row.type),
            },
            { key: "version", header: "Version" },
            {
              key: "status",
              header: "Status",
              cell: (row) => reportStatusBadge(row.status),
            },
            { key: "updatedAt", header: "Updated" },
            {
              key: "actions",
              header: "Update",
              className: "min-w-[200px]",
              cell: (row) => (
                <ReportRowActions
                  key={`${row.id}-${row.statusDb ?? ""}`}
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
