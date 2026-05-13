import Link from "next/link";
import type { ApprovalQueue } from "@/lib/db/admin/approvals";

type Props = {
  queue: ApprovalQueue;
  engagementId?: string | null;
};

const tabBase =
  "inline-flex items-center rounded-t-[var(--r-md)] border border-b-0 px-4 py-2 text-sm font-medium transition-colors";
const tabInactive = "border-transparent text-[var(--ink-600)] hover:text-[var(--ink-900)]";
const tabActive = "border-[var(--border)] bg-[var(--ink-0)] text-[var(--ink-900)]";

export function ApprovalQueueTabs({ queue, engagementId }: Props) {
  const openQ = new URLSearchParams();
  if (engagementId?.trim()) {
    openQ.set("engagement", engagementId.trim());
  }
  const openSuffix = openQ.toString() ? `?${openQ}` : "";

  const resolvedQ = new URLSearchParams({ queue: "resolved" });
  if (engagementId?.trim()) {
    resolvedQ.set("engagement", engagementId.trim());
  }
  const resolvedSuffix = `?${resolvedQ}`;

  return (
    <nav aria-label="Approval queue" className="flex gap-1 border-b border-[var(--border)]">
      <Link
        href={`/admin/approvals${openSuffix}`}
        className={`${tabBase} ${queue === "open" ? tabActive : tabInactive}`}
        aria-current={queue === "open" ? "page" : undefined}
      >
        Open
      </Link>
      <Link
        href={`/admin/approvals${resolvedSuffix}`}
        className={`${tabBase} ${queue === "resolved" ? tabActive : tabInactive}`}
        aria-current={queue === "resolved" ? "page" : undefined}
      >
        Resolved
      </Link>
    </nav>
  );
}
