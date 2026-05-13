import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import type { LeadRow } from "@/lib/admin/mock/leads";
import { getAdminLeads } from "@/lib/db/admin/leads";

export const metadata: Metadata = {
  title: "Leads",
};

export default async function AdminLeadsPage() {
  const { source, rows } = await getAdminLeads();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Leads"
        description="Free-score captures and detailed audit requests."
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
        <p className="text-sm text-[var(--ink-500)]">No leads yet.</p>
      ) : (
        <DataTable<LeadRow>
          columns={[
            { key: "domain", header: "Domain" },
            { key: "sector", header: "Sector" },
            { key: "email", header: "Email", className: "min-w-[200px]" },
            {
              key: "score",
              header: "Score",
              cell: (row) => <span className="tabular-nums font-medium">{row.score}</span>,
            },
            { key: "createdAt", header: "Created" },
            {
              key: "auditRequested",
              header: "Audit requested",
              cell: (row) =>
                row.auditRequested ? (
                  <StatusBadge variant="success">Yes</StatusBadge>
                ) : (
                  <StatusBadge variant="neutral">No</StatusBadge>
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
