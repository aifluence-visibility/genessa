"use client";

import { useState, useTransition } from "react";
import { updateAdminTask, enqueueAgentRunFromAdmin } from "@/app/admin/(main)/tasks/actions";
import type { TaskRow } from "@/lib/admin/mock/tasks";

type Props = {
  row: TaskRow;
  canMutate: boolean;
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

const APPROVAL_OPTIONS: { value: string; label: string }[] = [
  { value: "not_required", label: "Not required" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const errorMessages: Record<string, string> = {
  invalid_id: "Invalid task id.",
  no_fields: "Select at least one field to change.",
  invalid_status: "Invalid status value.",
  invalid_approval_state: "Invalid approval state.",
  supabase_not_configured: "Database is not configured.",
  not_found: "Task not found.",
  task_cancelled: "This task is cancelled and cannot be changed from the admin UI.",
  done_requires_approval_resolution:
    "Cannot mark done while approval is still pending — approve, reject, or set approval to not required first.",
  cannot_pending_while_done:
    "Cannot set approval to pending while the task is done — move status off done first.",
  invalid_task_id: "Invalid task id.",
  task_not_found: "Task not found.",
  agent_runs_table_missing: "Run migration 311 (agent_runs) on the database.",
  task_lookup_failed: "Could not load task.",
  insert_failed: "Could not queue agent run.",
};

function friendlyError(code: string) {
  return errorMessages[code] ?? code.replace(/_/g, " ");
}

export function TaskRowActions({ row, canMutate }: Props) {
  const statusDb = row.statusDb ?? "";
  const approvalDb = row.approvalDb ?? "";
  const [status, setStatus] = useState(statusDb);
  const [approval, setApproval] = useState(approvalDb);
  const [error, setError] = useState<string | null>(null);
  const [enqueueMsg, setEnqueueMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!canMutate || !statusDb || !approvalDb) {
    return (
      <span className="text-xs text-[var(--ink-400)]" title={!canMutate ? "Mock data or offline" : ""}>
        —
      </span>
    );
  }

  if (statusDb === "cancelled") {
    return (
      <span className="text-xs text-[var(--ink-500)]" title="Cancelled tasks are immutable in Stage 1 admin.">
        Cancelled
      </span>
    );
  }

  function runEnqueue() {
    setError(null);
    setEnqueueMsg(null);
    startTransition(async () => {
      const result = await enqueueAgentRunFromAdmin(row.id);
      if (!result.ok) {
        setError(friendlyError(result.error));
        return;
      }
      const short = result.runId.slice(0, 8);
      setEnqueueMsg(result.deduped ? `Run already exists · ${short}…` : `Queued · ${short}…`);
    });
  }

  function runStatus(next: string) {
    const prev = status;
    setStatus(next);
    setError(null);
    startTransition(async () => {
      const result = await updateAdminTask(row.id, { status: next, approval_state: null });
      if (!result.ok) {
        setError(friendlyError(result.error));
        setStatus(prev);
      }
    });
  }

  function runApproval(next: string) {
    const prev = approval;
    setApproval(next);
    setError(null);
    startTransition(async () => {
      const result = await updateAdminTask(row.id, { status: null, approval_state: next });
      if (!result.ok) {
        setError(friendlyError(result.error));
        setApproval(prev);
      }
    });
  }

  return (
    <div className="flex min-w-[220px] flex-col gap-2">
      {error ? (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {enqueueMsg ? (
        <p className="text-xs text-emerald-800" role="status">
          {enqueueMsg}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-[11px] font-medium text-[var(--ink-500)]">
        Status
        <select
          disabled={isPending}
          value={status}
          onChange={(e) => runStatus(e.target.value)}
          className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-2 py-1.5 text-sm text-[var(--ink-900)] disabled:opacity-50"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[11px] font-medium text-[var(--ink-500)]">
        Approval
        <select
          disabled={isPending}
          value={approval}
          onChange={(e) => runApproval(e.target.value)}
          className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-2 py-1.5 text-sm text-[var(--ink-900)] disabled:opacity-50"
        >
          {APPROVAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={isPending}
        onClick={runEnqueue}
        className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-50)] px-2 py-1.5 text-left text-[11px] font-medium text-[var(--ink-800)] hover:bg-[var(--ink-100)] disabled:opacity-50"
        title="Creates a pending agent_runs row for workers (npm run worker:agent-demo)"
      >
        Queue agent run
      </button>
    </div>
  );
}
