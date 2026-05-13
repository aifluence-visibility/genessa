import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { StatCard } from "@/components/admin/ui/stat-card";
import { getAdminDashboardData } from "@/lib/db/admin/dashboard";
import { DataTable } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import type { AuditRow } from "@/lib/admin/mock/audits";
import type { ActivityItem } from "@/lib/admin/mock/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

function activityAccent(type: ActivityItem["type"]) {
  switch (type) {
    case "audit":
      return "bg-violet-500";
    case "approval":
      return "bg-amber-500";
    case "lead":
      return "bg-[var(--genessa-blue)]";
    case "task":
      return "bg-emerald-500";
    case "report":
      return "bg-sky-500";
    case "engagement":
      return "bg-[var(--ink-400)]";
    default:
      return "bg-[var(--ink-400)]";
  }
}

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

export default async function AdminDashboardPage() {
  const { source, stats, recentActivity, auditsPreview } = await getAdminDashboardData();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <PageHeader
        title="Operations overview"
        description={
          source === "database"
            ? "Live metrics sourced from Supabase (service role, server-side only)."
            : "Configure Supabase env vars to hydrate this dashboard from Postgres; otherwise mock data is shown."
        }
        actions={
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--border)] ${
              source === "database"
                ? "bg-emerald-50 text-emerald-900"
                : "bg-[var(--ink-0)] text-[var(--ink-600)]"
            }`}
          >
            {source === "database" ? "Live database" : "Mock / offline data"}
          </span>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} hint={s.hint} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-2" padding="p-0">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[var(--ink-900)]">Recent activity</p>
                <p className="mt-1 text-xs text-[var(--ink-500)]">Latest signals across audits, tasks, and intake.</p>
              </div>
              <Link
                href="/admin/activity"
                className="shrink-0 text-xs font-medium text-[var(--genessa-blue)] hover:underline"
              >
                View all
              </Link>
            </div>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {recentActivity.length === 0 ? (
              <li className="px-5 py-6 text-sm text-[var(--ink-500)]">No activity events yet.</li>
            ) : (
              recentActivity.map((item) => (
                <li key={item.id} className="flex gap-3 px-5 py-4">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${activityAccent(item.type)}`} aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--ink-800)]">{item.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--ink-600)]">{item.detail}</p>
                    <p className="mt-2 text-xs text-[var(--ink-400)]">{item.time}</p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Panel>

        <Panel className="lg:col-span-3 overflow-hidden" padding="p-0">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <p className="text-sm font-semibold text-[var(--ink-900)]">Active audits</p>
            <p className="mt-1 text-xs text-[var(--ink-500)]">Subset preview — full table lives under Audits.</p>
          </div>
          <div className="border-t border-[var(--border)] p-0 sm:border-t-0">
            {auditsPreview.length === 0 ? (
              <div className="px-5 py-6 text-sm text-[var(--ink-500)]">No audits found.</div>
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
                rows={auditsPreview}
                getRowKey={(row) => row.id}
              />
            )}
          </div>
        </Panel>
      </section>
    </div>
  );
}
