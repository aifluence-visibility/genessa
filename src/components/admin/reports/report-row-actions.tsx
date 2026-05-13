"use client";

import { useState, useTransition } from "react";
import { updateAdminReport } from "@/app/admin/(main)/reports/actions";
import type { ReportRow } from "@/lib/admin/mock/reports";

type Props = {
  row: ReportRow;
  canMutate: boolean;
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "internal_review", label: "Internal review" },
  { value: "client_ready", label: "Client ready" },
  { value: "delivered", label: "Delivered" },
  { value: "archived", label: "Archived" },
];

const errorMessages: Record<string, string> = {
  invalid_id: "Invalid report id.",
  invalid_status: "Invalid status.",
  supabase_not_configured: "Database is not configured.",
  not_found: "Report not found.",
};

function friendlyError(code: string) {
  return errorMessages[code] ?? code.replace(/_/g, " ");
}

export function ReportRowActions({ row, canMutate }: Props) {
  const statusDb = row.statusDb ?? "";
  const [status, setStatus] = useState(statusDb);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!canMutate || !statusDb) {
    return (
      <span className="text-xs text-[var(--ink-400)]" title={!canMutate ? "Mock data or offline" : ""}>
        —
      </span>
    );
  }

  function run(next: string) {
    const prev = status;
    setStatus(next);
    setError(null);
    startTransition(async () => {
      const result = await updateAdminReport(row.id, next);
      if (!result.ok) {
        setError(friendlyError(result.error));
        setStatus(prev);
      }
    });
  }

  return (
    <div className="flex min-w-[200px] flex-col gap-2">
      {error ? (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <label className="flex flex-col gap-1 text-[11px] font-medium text-[var(--ink-500)]">
        Status
        <select
          disabled={isPending}
          value={status}
          onChange={(e) => run(e.target.value)}
          className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-2 py-1.5 text-sm text-[var(--ink-900)] disabled:opacity-50"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
