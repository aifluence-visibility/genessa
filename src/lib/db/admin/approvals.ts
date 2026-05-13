import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { mapLabel, approvalRiskLabel } from "@/lib/db/admin/labels";
import type { DataSource } from "@/lib/db/admin/labels";
import type { ApprovalRow } from "@/lib/admin/mock/approvals";

export type ApprovalQueue = "open" | "resolved";

export type AdminApprovalListItem = ApprovalRow & {
  /** Present on resolved queue only */
  resolutionLabel?: "Approved" | "Rejected" | "Rerun";
  resolvedAtDisplay?: string | null;
  /** Open row created by admin_rerun (links to superseded predecessor) */
  reopenedAfterApprovalId?: string | null;
  /** Resolved row: superseded via rerun workflow */
  resolvedClosedAsRerun?: boolean;
};

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function predecessorFromContext(context: unknown): string | null {
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    return null;
  }
  const raw = (context as Record<string, unknown>).reopened_after_approval_id;
  if (typeof raw !== "string" || !uuidRe.test(raw)) {
    return null;
  }
  return raw;
}

function lifecycleClosedAs(context: unknown): string | null {
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    return null;
  }
  const raw = (context as Record<string, unknown>).lifecycle_closed_as;
  return typeof raw === "string" ? raw : null;
}

function mapResolution(status: string): { label: AdminApprovalListItem["resolutionLabel"] } {
  switch (status) {
    case "approved":
      return { label: "Approved" };
    case "rejected":
      return { label: "Rejected" };
    case "superseded":
      return { label: "Rerun" };
    default:
      return { label: undefined };
  }
}

export async function getAdminApprovals(
  queue: ApprovalQueue = "open",
  engagementId?: string | null,
): Promise<{ source: DataSource; queue: ApprovalQueue; rows: AdminApprovalListItem[] }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    const { mockApprovals } = await import("@/lib/admin/mock/approvals");
    if (queue === "resolved") {
      return { source: "mock", queue, rows: [] };
    }
    return {
      source: "mock",
      queue,
      rows: mockApprovals.map((r) => ({ ...r })),
    };
  }

  let q = supabase
    .from("approval_requests")
    .select(
      `
      id,
      title,
      artifact_label,
      submitted_by_label,
      risk,
      status,
      submitted_at,
      resolved_at,
      context,
      engagements!inner (
        client_accounts!inner ( name )
      )
    `,
    );

  if (queue === "open") {
    q = q.eq("status", "open");
  } else {
    q = q.in("status", ["approved", "rejected", "superseded"]);
  }

  const eng = engagementId?.trim() ?? "";
  if (eng && uuidRe.test(eng)) {
    q = q.eq("engagement_id", eng);
  }

  const orderColumn = queue === "open" ? "submitted_at" : "resolved_at";
  const { data, error } = await q.order(orderColumn, { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[admin] approvals query failed", error);
    const { mockApprovals } = await import("@/lib/admin/mock/approvals");
    if (queue === "resolved") {
      return { source: "mock", queue, rows: [] };
    }
    return { source: "mock", queue, rows: mockApprovals.map((r) => ({ ...r })) };
  }

  const rows: AdminApprovalListItem[] = (data ?? []).map((row) => {
    const engagement = row.engagements as unknown as { client_accounts: { name: string } };
    const { label: resolutionLabel } = mapResolution(row.status);
    const predecessorId = queue === "open" ? predecessorFromContext(row.context) : null;
    const resolvedClosedAsRerun =
      queue === "resolved" && row.status === "superseded" && lifecycleClosedAs(row.context) === "rerun";
    return {
      id: row.id,
      title: row.title,
      client: engagement.client_accounts?.name ?? "—",
      artifact: row.artifact_label,
      owner: row.submitted_by_label ?? "—",
      submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : "—",
      risk: mapLabel(approvalRiskLabel, row.risk, row.risk) as ApprovalRow["risk"],
      resolutionLabel: queue === "resolved" ? resolutionLabel : undefined,
      resolvedAtDisplay:
        queue === "resolved" && row.resolved_at ? new Date(row.resolved_at).toISOString() : null,
      reopenedAfterApprovalId: predecessorId,
      resolvedClosedAsRerun: resolvedClosedAsRerun || undefined,
    };
  });

  return { source: "database", queue, rows };
}
