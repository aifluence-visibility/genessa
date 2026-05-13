import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import type { AuditRow } from "@/lib/admin/mock/audits";
import { getAdminAudits } from "@/lib/db/admin/audits";

export const metadata: Metadata = {
  title: "Audits",
};

function auditBadge(status: AuditRow["status"]) {
  switch (status) {
    case "Pending":
      return <StatusBadge variant="neutral">{status}</StatusBadge>;
    case "In Progress":
      return <StatusBadge variant="info">{status}</StatusBadge>;
    case "Waiting Review":
      return <StatusBadge variant="warning">{status}</StatusBadge>;
    case "Completed":
      return <StatusBadge variant="success">{status}</StatusBadge>;
    default:
      return <StatusBadge>{status}</StatusBadge>;
  }
}

export default async function AdminAuditsPage() {
  const { source, rows } = await getAdminAudits();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Audits"
        description="Lifecycle tracking for detailed AI Visibility audits — from intake through human review."
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
        <p className="text-sm text-[var(--ink-500)]">No audits yet.</p>
      ) : (
        <DataTable<AuditRow>
          columns={[
            { key: "domain", header: "Domain" },
            { key: "sector", header: "Sector" },
            {
              key: "status",
              header: "Status",
              cell: (row) => auditBadge(row.status),
            },
            { key: "owner", header: "Owner" },
            { key: "updatedAt", header: "Updated" },
          ]}
          rows={rows}
          getRowKey={(row) => row.id}
        />
      )}
    </div>
  );
}
