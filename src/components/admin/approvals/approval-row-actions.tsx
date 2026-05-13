"use client";

import { useState } from "react";
import {
  approveApprovalRequest,
  rejectApprovalRequest,
  rerunApprovalRequest,
} from "@/app/admin/(main)/approvals/actions";

type Props = {
  approvalId: string;
  canMutate: boolean;
};

type PendingKey = "approve" | "reject" | "rerun";

const errorMessages: Record<string, string> = {
  invalid_id: "Invalid approval id.",
  supabase_not_configured: "Database is not configured.",
  not_found_or_not_open: "This item is no longer open or was already processed.",
  duplicate_open_task_approval:
    "Another open approval for this task exists (possibly created just now). Refresh the queue and try again.",
  duplicate_open_report_approval:
    "Another open approval for this report exists (possibly created just now). Refresh the queue and try again.",
};

export function ApprovalRowActions({ approvalId, canMutate }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<PendingKey | null>(null);

  function friendlyError(code: string) {
    return errorMessages[code] ?? code.replace(/_/g, " ");
  }

  async function run(kind: PendingKey) {
    setError(null);
    setPendingKey(kind);
    const fn =
      kind === "approve"
        ? approveApprovalRequest
        : kind === "reject"
          ? rejectApprovalRequest
          : rerunApprovalRequest;
    const result = await fn(approvalId);
    setPendingKey(null);
    if (!result.ok) {
      setError(friendlyError(result.error));
    }
  }

  const busy = pendingKey !== null;

  return (
    <div className="flex min-w-0 flex-col items-stretch gap-2 sm:items-end">
      {error ? (
        <p className="max-w-[280px] text-right text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          disabled={!canMutate || busy}
          onClick={() => void run("approve")}
          className="inline-flex h-9 min-w-[96px] items-center justify-center rounded-[var(--r-md)] bg-[var(--score-good)] px-3 text-sm font-medium text-white shadow-[var(--shadow-xs)] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingKey === "approve" ? "Approving…" : "Approve"}
        </button>
        <button
          type="button"
          disabled={!canMutate || busy}
          onClick={() => void run("reject")}
          className="inline-flex h-9 min-w-[96px] items-center justify-center rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 text-sm font-medium text-[var(--ink-800)] shadow-[var(--shadow-xs)] hover:bg-[var(--ink-50)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingKey === "reject" ? "Rejecting…" : "Reject"}
        </button>
        <button
          type="button"
          disabled={!canMutate || busy}
          onClick={() => void run("rerun")}
          className="inline-flex h-9 min-w-[96px] items-center justify-center rounded-[var(--r-md)] border border-transparent bg-[var(--ink-100)] px-3 text-sm font-medium text-[var(--ink-800)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingKey === "rerun" ? "Working…" : "Rerun"}
        </button>
      </div>
    </div>
  );
}
