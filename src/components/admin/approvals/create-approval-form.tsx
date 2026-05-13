"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { createApprovalRequest } from "@/app/admin/(main)/approvals/actions";
import type { ApprovalTargetReportOption, ApprovalTargetTaskOption } from "@/lib/db/admin/approval-create-options";

type Props = {
  engagementId: string;
  engagementLabel: string;
  tasks: ApprovalTargetTaskOption[];
  reports: ApprovalTargetReportOption[];
  canSubmit: boolean;
};

const errorMessages: Record<string, string> = {
  invalid_engagement: "Invalid engagement.",
  empty_title_or_artifact: "Title and artifact label are required.",
  invalid_risk: "Invalid risk level.",
  invalid_task: "Choose a task or task not found.",
  invalid_report: "Choose a report or report not found.",
  supabase_not_configured: "Database is not configured.",
  create_failed: "Could not create approval.",
  xor_target: "Choose either a task or a report, not both.",
  needs_target: "Choose a task or a report.",
  task_engagement_mismatch: "Task does not belong to this engagement.",
  report_engagement_mismatch: "Report does not belong to this engagement.",
  duplicate_open_task_approval: "This task already has an open approval. Resolve or reject it before opening another.",
  duplicate_open_report_approval:
    "This report already has an open approval. Resolve or reject it before opening another.",
};

function friendlyError(code: string) {
  return errorMessages[code] ?? code.replace(/_/g, " ");
}

export function CreateApprovalForm({ engagementId, engagementLabel, tasks, reports, canSubmit }: Props) {
  const router = useRouter();
  const [target, setTarget] = useState<"task" | "report">("task");
  const [taskId, setTaskId] = useState(tasks[0]?.id ?? "");
  const [reportId, setReportId] = useState(reports[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [artifactLabel, setArtifactLabel] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [risk, setRisk] = useState("medium");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createApprovalRequest({
        engagementId,
        target,
        taskId: target === "task" ? taskId : null,
        reportId: target === "report" ? reportId : null,
        title,
        artifactLabel,
        submittedByLabel: submittedBy || null,
        risk,
      });
      if (!result.ok) {
        setError(friendlyError(result.error));
        return;
      }
      router.push("/admin/approvals");
    });
  }

  if (!canSubmit) {
    return (
      <p className="text-sm text-[var(--ink-500)]">
        Connect Supabase with the service role to create approvals from the admin UI.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4">
      <p className="text-sm text-[var(--ink-600)]">
        Engagement: <span className="font-medium text-[var(--ink-900)]">{engagementLabel}</span>{" "}
        <Link href="/admin/approvals/new" className="text-xs font-medium text-[var(--genessa-blue)] hover:underline">
          Change
        </Link>
      </p>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-xs font-medium text-[var(--ink-600)]">Link to</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="target"
            checked={target === "task"}
            onChange={() => setTarget("task")}
            className="accent-[var(--genessa-blue)]"
          />
          Task output
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="target"
            checked={target === "report"}
            onChange={() => setTarget("report")}
            className="accent-[var(--genessa-blue)]"
          />
          Report artifact
        </label>
      </fieldset>

      {target === "task" ? (
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--ink-600)]">
          Task
          <select
            required
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            disabled={tasks.length === 0 || isPending}
            className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 py-2 text-sm text-[var(--ink-900)]"
          >
            {tasks.length === 0 ? (
              <option value="">No tasks for this engagement</option>
            ) : (
              tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))
            )}
          </select>
        </label>
      ) : (
        <label className="flex flex-col gap-1 text-xs font-medium text-[var(--ink-600)]">
          Report
          <select
            required
            value={reportId}
            onChange={(e) => setReportId(e.target.value)}
            disabled={reports.length === 0 || isPending}
            className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 py-2 text-sm text-[var(--ink-900)]"
          >
            {reports.length === 0 ? (
              <option value="">No reports for this engagement</option>
            ) : (
              reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))
            )}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1 text-xs font-medium text-[var(--ink-600)]">
        Review title
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending}
          placeholder="e.g. Schema findings — sign-off"
          className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 py-2 text-sm text-[var(--ink-900)]"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-[var(--ink-600)]">
        Artifact label
        <input
          required
          value={artifactLabel}
          onChange={(e) => setArtifactLabel(e.target.value)}
          disabled={isPending}
          placeholder="e.g. schema_findings_v2.json"
          className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 py-2 text-sm text-[var(--ink-900)]"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-[var(--ink-600)]">
        Submitted by (optional)
        <input
          value={submittedBy}
          onChange={(e) => setSubmittedBy(e.target.value)}
          disabled={isPending}
          placeholder="e.g. Consulting · A. Okonkwo"
          className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 py-2 text-sm text-[var(--ink-900)]"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-[var(--ink-600)]">
        Risk
        <select
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          disabled={isPending}
          className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 py-2 text-sm text-[var(--ink-900)]"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="submit"
          disabled={
            isPending ||
            (target === "task" && (tasks.length === 0 || !taskId)) ||
            (target === "report" && (reports.length === 0 || !reportId))
          }
          className="inline-flex h-10 items-center justify-center rounded-[var(--r-md)] bg-[var(--ink-900)] px-4 text-sm font-medium text-[var(--ink-0)] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Creating…" : "Create open approval"}
        </button>
        <Link
          href="/admin/approvals"
          className="inline-flex h-10 items-center justify-center rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-4 text-sm font-medium text-[var(--ink-800)] hover:bg-[var(--ink-50)]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
