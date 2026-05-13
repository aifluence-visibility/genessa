import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import type { ActivityTimelineRow } from "@/lib/db/admin/activity";
import { getAdminActivity, getAdminEngagementFilterOptions } from "@/lib/db/admin/activity";
import type { ActivityItem } from "@/lib/admin/mock/dashboard";

export const metadata: Metadata = {
  title: "Activity",
};

const EVENT_FILTER_OPTIONS: { value: "" | ActivityItem["type"]; label: string }[] = [
  { value: "", label: "All types" },
  { value: "approval", label: "Approval" },
  { value: "audit", label: "Audit" },
  { value: "task", label: "Task" },
  { value: "engagement", label: "Engagement" },
  { value: "lead", label: "Lead" },
  { value: "report", label: "Report" },
];

type PageProps = {
  searchParams?: Promise<{ engagement?: string; type?: string; page?: string }>;
};

function buildActivityHref(args: {
  engagement?: string | null;
  type?: string | null;
  page?: number;
}): string {
  const p = new URLSearchParams();
  if (args.engagement) {
    p.set("engagement", args.engagement);
  }
  if (args.type) {
    p.set("type", args.type);
  }
  if (args.page && args.page > 1) {
    p.set("page", String(args.page));
  }
  const q = p.toString();
  return q ? `/admin/activity?${q}` : "/admin/activity";
}

function typeBadgeVariant(
  t: ActivityItem["type"],
): "neutral" | "info" | "success" | "warning" | "danger" {
  switch (t) {
    case "approval":
      return "info";
    case "audit":
      return "warning";
    case "lead":
      return "neutral";
    case "task":
      return "success";
    case "report":
      return "neutral";
    case "engagement":
    default:
      return "neutral";
  }
}

function typeLabel(t: ActivityItem["type"]): string {
  switch (t) {
    case "approval":
      return "Approval";
    case "audit":
      return "Audit";
    case "lead":
      return "Lead";
    case "task":
      return "Task";
    case "engagement":
      return "Engagement";
    case "report":
      return "Report";
    default:
      return t;
  }
}

function taskChangeBadge(field: ActivityTimelineRow["taskChange"]) {
  if (!field) {
    return null;
  }
  if (field === "status") {
    return <StatusBadge variant="neutral">Status</StatusBadge>;
  }
  return <StatusBadge variant="info">Approval state</StatusBadge>;
}

function approvalActionBadge(action: ActivityTimelineRow["approvalAction"]) {
  if (!action) {
    return null;
  }
  switch (action) {
    case "approve":
      return <StatusBadge variant="success">Approved</StatusBadge>;
    case "open":
      return <StatusBadge variant="neutral">Requested</StatusBadge>;
    case "reject":
      return <StatusBadge variant="danger">Rejected</StatusBadge>;
    case "rerun":
      return <StatusBadge variant="warning">Rerun</StatusBadge>;
    default:
      return null;
  }
}

export default async function AdminActivityPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const engagementRaw = sp.engagement?.trim() || "";
  const typeRaw = sp.type?.trim() || "";
  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  const [{ options: engagementOptions }, activity] = await Promise.all([
    getAdminEngagementFilterOptions(),
    getAdminActivity({
      engagementId: engagementRaw || null,
      eventType: typeRaw || null,
      page,
    }),
  ]);

  const { source, rows, hasMore, pageSize } = activity;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Activity"
        description="Append-only operational timeline across approvals, audits, tasks, and engagements (Stage 1 internal)."
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

      <Panel padding="p-4" className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <form method="get" className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-[var(--ink-600)]">
            Engagement
            <select
              name="engagement"
              defaultValue={engagementRaw}
              className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 py-2 text-sm text-[var(--ink-900)]"
            >
              <option value="">All engagements</option>
              {engagementOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[140px] flex-col gap-1 text-xs font-medium text-[var(--ink-600)]">
            Event type
            <select
              name="type"
              defaultValue={typeRaw}
              className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 py-2 text-sm text-[var(--ink-900)]"
            >
              {EVENT_FILTER_OPTIONS.map((o) => (
                <option key={o.label + o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2 pb-0.5 sm:pt-5">
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-[var(--r-md)] bg-[var(--ink-900)] px-4 text-sm font-medium text-[var(--ink-0)] hover:opacity-95"
            >
              Apply
            </button>
            <Link
              href="/admin/activity"
              className="inline-flex h-9 items-center justify-center rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-4 text-sm font-medium text-[var(--ink-800)] hover:bg-[var(--ink-50)]"
            >
              Reset
            </Link>
          </div>
        </form>
      </Panel>

      {rows.length === 0 ? (
        <p className="text-sm text-[var(--ink-500)]">
          No events match these filters. Try widening the scope or reset filters.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Panel padding="p-4" className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge variant={typeBadgeVariant(row.eventType)}>{typeLabel(row.eventType)}</StatusBadge>
                  {row.eventType === "approval" ? approvalActionBadge(row.approvalAction) : null}
                  {row.eventType === "task" ? taskChangeBadge(row.taskChange) : null}
                  {row.eventType === "report" && row.reportChange ? (
                    <StatusBadge variant="neutral">Status</StatusBadge>
                  ) : null}
                  <span className="text-xs text-[var(--ink-500)]" title={row.createdAtIso}>
                    {row.timeRelative} · {row.dateAbsolute}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[var(--ink-900)]">{row.title}</p>
                {row.detail ? (
                  <p className="text-sm text-[var(--ink-600)]">{row.detail}</p>
                ) : null}
                <p className="text-xs text-[var(--ink-500)]">
                  {row.clientName ? (
                    <>
                      <span className="font-medium text-[var(--ink-700)]">{row.clientName}</span>
                      <span className="mx-1.5 text-[var(--ink-300)]">·</span>
                    </>
                  ) : (
                    <span className="text-[var(--ink-400)]">Workspace-wide</span>
                  )}
                  {row.actorLabel ? (
                    <>
                      <span className="mx-1.5 text-[var(--ink-300)]">·</span>
                      Actor: {row.actorLabel}
                    </>
                  ) : null}
                  {row.payloadHint ? (
                    <>
                      <span className="mx-1.5 text-[var(--ink-300)]">·</span>
                      <span title={row.payloadHint}>{row.payloadHint}</span>
                    </>
                  ) : null}
                </p>
              </Panel>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4 text-sm text-[var(--ink-600)]">
        <span>
          Page {page}
          {source === "database" ? ` · up to ${pageSize} events` : null}
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link
              href={buildActivityHref({
                engagement: engagementRaw || null,
                type: typeRaw || null,
                page: page - 1,
              })}
              className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 py-1.5 font-medium text-[var(--ink-800)] hover:bg-[var(--ink-50)]"
            >
              Newer
            </Link>
          ) : null}
          {hasMore ? (
            <Link
              href={buildActivityHref({
                engagement: engagementRaw || null,
                type: typeRaw || null,
                page: page + 1,
              })}
              className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 py-1.5 font-medium text-[var(--ink-800)] hover:bg-[var(--ink-50)]"
            >
              Older
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
