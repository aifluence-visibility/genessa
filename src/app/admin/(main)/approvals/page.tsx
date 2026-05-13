import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { ApprovalQueueTabs } from "@/components/admin/approvals/approval-queue-tabs";
import { ApprovalRowActions } from "@/components/admin/approvals/approval-row-actions";
import { toDisplayDate } from "@/lib/db/admin/format";
import type { AdminApprovalListItem, ApprovalQueue } from "@/lib/db/admin/approvals";
import { getAdminApprovals } from "@/lib/db/admin/approvals";

export const metadata: Metadata = {
  title: "Approvals",
};

type PageProps = {
  searchParams?: Promise<{ queue?: string; engagement?: string }>;
};

function riskBadge(risk: "Low" | "Medium" | "High") {
  switch (risk) {
    case "High":
      return <StatusBadge variant="danger">{risk}</StatusBadge>;
    case "Medium":
      return <StatusBadge variant="warning">{risk}</StatusBadge>;
    case "Low":
    default:
      return <StatusBadge variant="neutral">{risk}</StatusBadge>;
  }
}

function resolutionBadge(label: AdminApprovalListItem["resolutionLabel"]) {
  if (!label) return null;
  switch (label) {
    case "Approved":
      return <StatusBadge variant="success">{label}</StatusBadge>;
    case "Rejected":
      return <StatusBadge variant="danger">{label}</StatusBadge>;
    case "Rerun":
      return <StatusBadge variant="warning">{label}</StatusBadge>;
    default:
      return null;
  }
}

export default async function AdminApprovalsPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const queue: ApprovalQueue = sp.queue === "resolved" ? "resolved" : "open";
  const engagementRaw = sp.engagement?.trim() || "";
  const { source, rows } = await getAdminApprovals(queue, engagementRaw || null);

  const emptyCopy =
    queue === "resolved"
      ? "No resolved approvals yet. Approvals you approve, reject, or send back for rerun will land here."
      : "No open approvals. Great time for a coffee.";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Approvals"
        description={
          engagementRaw ? (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Human review queue for consultant- and agent-produced artifacts before external release.</span>
              <span className="text-[var(--ink-500)]">·</span>
              <span className="text-[var(--ink-600)]">Filtered to one engagement.</span>
              <Link href={`/admin/engagements/${engagementRaw}`} className="text-[var(--genessa-blue)] hover:underline">
                Open engagement
              </Link>
              <span className="text-[var(--ink-500)]">·</span>
              <Link href={queue === "resolved" ? "/admin/approvals?queue=resolved" : "/admin/approvals"} className="text-[var(--genessa-blue)] hover:underline">
                Clear filter
              </Link>
            </span>
          ) : (
            "Human review queue for consultant- and agent-produced artifacts before external release."
          )
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/approvals/new"
              className="inline-flex h-9 items-center justify-center rounded-[var(--r-md)] bg-[var(--ink-900)] px-3 text-sm font-medium text-[var(--ink-0)] hover:opacity-95"
            >
              New approval
            </Link>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--border)] ${
                source === "database" ? "bg-emerald-50 text-emerald-900" : "bg-[var(--ink-0)] text-[var(--ink-600)]"
              }`}
            >
              {source === "database" ? "Live database" : "Mock / offline data"}
            </span>
          </div>
        }
      />

      <ApprovalQueueTabs queue={queue} engagementId={engagementRaw || null} />

      {rows.length === 0 ? (
        <p className="text-sm text-[var(--ink-500)]">{emptyCopy}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((item) => (
            <li key={item.id}>
              <Panel padding="p-5" className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--ink-900)]">{item.title}</p>
                    {riskBadge(item.risk)}
                    {queue === "open" && item.reopenedAfterApprovalId ? (
                      <span title={`Prior approval ${item.reopenedAfterApprovalId}`}>
                        <StatusBadge variant="info">Rework</StatusBadge>
                      </span>
                    ) : null}
                    {queue === "resolved" ? resolutionBadge(item.resolutionLabel) : null}
                  </div>
                  <p className="text-sm text-[var(--ink-600)]">
                    <span className="font-medium text-[var(--ink-800)]">{item.client}</span>
                    <span className="text-[var(--ink-300)]"> · </span>
                    {item.artifact}
                  </p>
                  <p className="text-xs text-[var(--ink-500)]">
                    Owner: {item.owner}
                    <span className="mx-2 text-[var(--ink-300)]">·</span>
                    Submitted {item.submittedAt}
                    {queue === "resolved" && item.resolvedAtDisplay ? (
                      <>
                        <span className="mx-2 text-[var(--ink-300)]">·</span>
                        Resolved {toDisplayDate(item.resolvedAtDisplay)}
                      </>
                    ) : null}
                  </p>
                  {queue === "open" && item.reopenedAfterApprovalId ? (
                    <p
                      className="text-xs text-[var(--ink-500)]"
                      title={`Prior approval ${item.reopenedAfterApprovalId}`}
                    >
                      Follow-up after rerun — hover for the prior approval id.
                    </p>
                  ) : null}
                  {queue === "resolved" && item.resolvedClosedAsRerun ? (
                    <p className="text-xs text-[var(--ink-500)]">
                      Superseded for rework; the replacement request is usually titled “… — rework” under Open.
                    </p>
                  ) : null}
                </div>

                {queue === "open" ? (
                  <ApprovalRowActions approvalId={item.id} canMutate={source === "database"} />
                ) : null}
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
