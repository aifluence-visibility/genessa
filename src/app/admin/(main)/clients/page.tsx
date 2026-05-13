import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DataTable } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import type { ClientRow } from "@/lib/admin/mock/clients";
import { getAdminActiveClients } from "@/lib/db/admin/clients";

export const metadata: Metadata = {
  title: "Active Clients",
};

export default async function AdminClientsPage() {
  const { source, rows } = await getAdminActiveClients();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Active clients"
        description="Engaged accounts with sector packs, sprint focus, and visibility trajectory."
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
        <p className="text-sm text-[var(--ink-500)]">No active engagements found.</p>
      ) : (
        <DataTable<ClientRow>
          columns={[
            {
              key: "name",
              header: "Client",
              cell: (row) => (
                <Link
                  href={`/admin/engagements/${row.engagementId}`}
                  className="font-medium text-[var(--genessa-blue)] hover:underline"
                >
                  {row.name}
                </Link>
              ),
            },
            { key: "domain", header: "Domain" },
            {
              key: "sectorPack",
              header: "Sector pack",
              cell: (row) => <StatusBadge variant="info">{row.sectorPack}</StatusBadge>,
            },
            {
              key: "score",
              header: "Score",
              cell: (row) => <span className="tabular-nums font-semibold">{row.score}</span>,
            },
            { key: "sprint", header: "Current sprint", className: "min-w-[220px]" },
            { key: "roadmap", header: "Roadmap" },
          ]}
          rows={rows}
          getRowKey={(row) => row.engagementId}
        />
      )}
    </div>
  );
}
