import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import type { ProposalRow } from "@/lib/admin/mock/proposals";
import { getAdminProposals } from "@/lib/db/admin/proposals";

export const metadata: Metadata = {
  title: "Proposals",
};

function proposalBadge(status: ProposalRow["status"]) {
  switch (status) {
    case "Draft":
      return <StatusBadge variant="neutral">{status}</StatusBadge>;
    case "Internal review":
      return <StatusBadge variant="warning">{status}</StatusBadge>;
    case "Sent":
      return <StatusBadge variant="info">{status}</StatusBadge>;
    case "Accepted":
      return <StatusBadge variant="success">{status}</StatusBadge>;
    case "Lost":
      return <StatusBadge variant="danger">{status}</StatusBadge>;
    default:
      return <StatusBadge>{status}</StatusBadge>;
  }
}

export default async function AdminProposalsPage() {
  const { source, rows } = await getAdminProposals();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Proposals"
        description="Roadmaps, target scores, and commercial packaging — reviewed internally before client delivery."
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
        <p className="text-sm text-[var(--ink-500)]">No proposals yet.</p>
      ) : (
        <DataTable<ProposalRow>
          columns={[
            { key: "client", header: "Client" },
            { key: "duration", header: "Duration" },
            {
              key: "targetScore",
              header: "Target score",
              cell: (row) => <span className="tabular-nums font-medium">{row.targetScore}</span>,
            },
            { key: "pricing", header: "Pricing" },
            {
              key: "status",
              header: "Status",
              cell: (row) => proposalBadge(row.status),
            },
            { key: "updatedAt", header: "Updated" },
          ]}
          rows={rows}
          getRowKey={(row) => row.id}
        />
      )}
    </div>
  );
}
