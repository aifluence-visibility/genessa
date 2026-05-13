"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelAdminAgentRun, failAdminAgentRunStuck } from "@/app/admin/(main)/agent-runs/actions";

const errLabel: Record<string, string> = {
  invalid_id: "Invalid run id.",
  supabase_not_configured: "Supabase is not configured for this environment.",
  load_failed: "Could not load the run.",
  not_found: "Run not found.",
  invalid_state: "This action does not apply to the current status.",
  update_failed: "Update failed.",
  concurrent_update: "Run changed in the background; refresh and try again.",
};

export function AgentRunControls({
  runId,
  statusDb,
  canMutate,
}: {
  runId: string;
  statusDb: string;
  canMutate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const st = statusDb.toLowerCase();
  const showCancel = st === "pending" || st === "running";
  const showFailStuck = st === "running";

  if (!canMutate || (!showCancel && !showFailStuck)) {
    return null;
  }

  const onCancel = () => {
    setMsg(null);
    startTransition(async () => {
      const r = await cancelAdminAgentRun(runId);
      if (!r.ok) {
        setMsg(errLabel[r.error] ?? r.error);
        return;
      }
      router.refresh();
    });
  };

  const onFailStuck = () => {
    setMsg(null);
    startTransition(async () => {
      const r = await failAdminAgentRunStuck(runId);
      if (!r.ok) {
        setMsg(errLabel[r.error] ?? r.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] p-4">
      <p className="text-sm font-semibold text-[var(--ink-900)]">Operator actions</p>
      <p className="mt-1 text-xs text-[var(--ink-500)]">
        Cancel queued work or mark a stuck running row failed (requires live DB).
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {showCancel ? (
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="inline-flex h-9 items-center justify-center rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 text-sm font-medium text-[var(--ink-800)] hover:bg-[var(--ink-50)] disabled:opacity-50"
          >
            Cancel run
          </button>
        ) : null}
        {showFailStuck ? (
          <button
            type="button"
            disabled={pending}
            onClick={onFailStuck}
            className="inline-flex h-9 items-center justify-center rounded-[var(--r-md)] border border-amber-300 bg-amber-50 px-3 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-50"
          >
            Mark failed (stuck)
          </button>
        ) : null}
      </div>
      {msg ? <p className="mt-2 text-sm text-red-700">{msg}</p> : null}
    </div>
  );
}
