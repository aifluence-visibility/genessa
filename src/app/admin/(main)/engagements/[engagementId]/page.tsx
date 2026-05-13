import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { toDisplayDate } from "@/lib/db/admin/format";
import { getAdminEngagementDetail } from "@/lib/db/admin/engagement-detail";

type PageProps = {
  params: Promise<{ engagementId: string }>;
};

function engagementStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s.includes("active")) return <StatusBadge variant="success">{status}</StatusBadge>;
  if (s.includes("paused") || s.includes("draft")) return <StatusBadge variant="warning">{status}</StatusBadge>;
  if (s.includes("churn")) return <StatusBadge variant="danger">{status}</StatusBadge>;
  if (s.includes("complete")) return <StatusBadge variant="info">{status}</StatusBadge>;
  return <StatusBadge variant="neutral">{status}</StatusBadge>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { engagementId } = await params;
  const result = await getAdminEngagementDetail(engagementId);
  if (result.source === "not_found") {
    return { title: "Engagement" };
  }
  return { title: `${result.detail.clientName} · Engagement` };
}

export default async function AdminEngagementDetailPage({ params }: PageProps) {
  const { engagementId } = await params;
  const result = await getAdminEngagementDetail(engagementId);
  if (result.source === "not_found") {
    notFound();
  }

  const { source, detail } = result;
  const q = new URLSearchParams({ engagement: detail.id });

  const linkClass =
    "inline-flex h-9 items-center justify-center rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 text-sm font-medium text-[var(--ink-800)] hover:bg-[var(--ink-50)]";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title={detail.clientName}
        description={
          <>
            <span className="mr-2 inline-flex align-middle">{engagementStatusBadge(detail.status)}</span>
            <span className="text-[var(--ink-600)]">
              {detail.kind}
              <span className="mx-2 text-[var(--ink-300)]">·</span>
              {detail.sectorPack} pack
              <span className="mx-2 text-[var(--ink-300)]">·</span>
              {detail.domain}
            </span>
          </>
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

      {detail.deletedAt ? (
        <p className="rounded-[var(--r-md)] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          This engagement is <span className="font-medium">deleted</span> in the database (soft delete). Counts and
          links still reflect historical rows.
        </p>
      ) : null}

      <Panel>
        <h2 className="text-sm font-semibold text-[var(--ink-900)]">Program</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Roadmap</dt>
            <dd className="mt-0.5 text-[var(--ink-800)]">{detail.roadmapPhase ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Current sprint</dt>
            <dd className="mt-0.5 text-[var(--ink-800)]">{detail.currentSprint ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Visibility score</dt>
            <dd className="mt-0.5 tabular-nums font-semibold text-[var(--ink-800)]">{detail.visibilityScore}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Schedule</dt>
            <dd className="mt-0.5 text-[var(--ink-800)]">
              {toDisplayDate(detail.startedOn)} → {toDisplayDate(detail.endedOn)}
            </dd>
          </div>
        </dl>
        {detail.sprintProgressPct != null ? (
          <p className="mt-4 text-sm text-[var(--ink-600)]">
            <span className="font-medium text-[var(--ink-800)]">Sprint progress</span>
            <span className="mx-2 text-[var(--ink-300)]">·</span>
            {detail.sprintProgressPct}%
            {detail.sprintProgressHint ? (
              <>
                <span className="mx-2 text-[var(--ink-300)]">·</span>
                {detail.sprintProgressHint}
              </>
            ) : null}
          </p>
        ) : null}
      </Panel>

      <Panel>
        <h2 className="text-sm font-semibold text-[var(--ink-900)]">Volume</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {(
            [
              ["Tasks", detail.counts.tasks],
              ["Reports", detail.counts.reports],
              ["Open approvals", detail.counts.openApprovals],
              ["Audits", detail.counts.audits],
              ["Proposals", detail.counts.proposals],
              ["Sprints", detail.counts.sprints],
            ] as const
          ).map(([label, value]) => (
            <li key={label} className="rounded-[var(--r-md)] bg-[var(--ink-50)] px-3 py-2">
              <p className="text-xs font-medium text-[var(--ink-500)]">{label}</p>
              <p className="mt-0.5 tabular-nums text-lg font-semibold text-[var(--ink-900)]">{value}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        <h2 className="mb-3 text-sm font-semibold text-[var(--ink-900)]">Shortcuts</h2>
        <div className="flex flex-wrap gap-2">
          <Link className={linkClass} href={`/admin/activity?${q}`}>
            Activity timeline
          </Link>
          <Link className={linkClass} href={`/admin/tasks?${q}`}>
            Tasks
          </Link>
          <Link className={linkClass} href={`/admin/agents?${q}`}>
            Agents
          </Link>
          <Link className={linkClass} href={`/admin/agent-runs?${q}`}>
            Agent runs
          </Link>
          <Link className={linkClass} href={`/admin/sprints?${q}`}>
            Sprints
          </Link>
          <Link className={linkClass} href={`/admin/reports?${q}`}>
            Reports
          </Link>
          <Link className={linkClass} href={`/admin/approvals?${q}`}>
            Approvals
          </Link>
          <Link
            className={`${linkClass} border-[var(--ink-900)] bg-[var(--ink-900)] text-[var(--ink-0)] hover:opacity-95`}
            href={`/admin/approvals/new?${q}`}
          >
            New approval
          </Link>
          <Link className={linkClass} href="/admin/clients">
            ← Active clients
          </Link>
        </div>
      </Panel>
    </div>
  );
}
