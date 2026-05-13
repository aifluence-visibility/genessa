"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

export type ApprovalMutationResult =
  | { ok: true }
  | { ok: false; error: string };

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseApprovalId(approvalId: string): string | null {
  const id = approvalId?.trim() ?? "";
  if (!id || !uuidRe.test(id)) {
    return null;
  }
  return id;
}

async function revalidateApprovalSurfaces() {
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/tasks");
  revalidatePath("/admin/activity");
}

/** @deprecated use ApprovalMutationResult */
export type ApproveApprovalResult = ApprovalMutationResult;

export async function approveApprovalRequest(
  approvalId: string,
  actorLabel?: string | null,
): Promise<ApprovalMutationResult> {
  const id = parseApprovalId(approvalId);
  if (!id) {
    return { ok: false, error: "invalid_id" };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { ok: false, error: "supabase_not_configured" };
  }

  const label = (actorLabel?.trim() || "Internal").slice(0, 200);

  const { data, error } = await supabase.rpc("admin_approve_approval_request", {
    p_approval_id: id,
    p_actor_label: label,
  });

  if (error) {
    console.error("[approveApprovalRequest]", error);
    return { ok: false, error: error.message };
  }

  const payload = data as { ok?: boolean; error?: string } | null;
  if (!payload?.ok) {
    return { ok: false, error: payload?.error ?? "not_found_or_not_open" };
  }

  await revalidateApprovalSurfaces();

  return { ok: true };
}

export async function rejectApprovalRequest(
  approvalId: string,
  actorLabel?: string | null,
): Promise<ApprovalMutationResult> {
  const id = parseApprovalId(approvalId);
  if (!id) {
    return { ok: false, error: "invalid_id" };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { ok: false, error: "supabase_not_configured" };
  }

  const label = (actorLabel?.trim() || "Internal").slice(0, 200);

  const { data, error } = await supabase.rpc("admin_reject_approval_request", {
    p_approval_id: id,
    p_actor_label: label,
  });

  if (error) {
    console.error("[rejectApprovalRequest]", error);
    return { ok: false, error: error.message };
  }

  const payload = data as { ok?: boolean; error?: string } | null;
  if (!payload?.ok) {
    return { ok: false, error: payload?.error ?? "not_found_or_not_open" };
  }

  await revalidateApprovalSurfaces();

  return { ok: true };
}

export async function rerunApprovalRequest(
  approvalId: string,
  actorLabel?: string | null,
): Promise<ApprovalMutationResult> {
  const id = parseApprovalId(approvalId);
  if (!id) {
    return { ok: false, error: "invalid_id" };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { ok: false, error: "supabase_not_configured" };
  }

  const label = (actorLabel?.trim() || "Internal").slice(0, 200);

  const { data, error } = await supabase.rpc("admin_rerun_approval_request", {
    p_approval_id: id,
    p_actor_label: label,
  });

  if (error) {
    console.error("[rerunApprovalRequest]", error);
    return { ok: false, error: error.message };
  }

  const payload = data as { ok?: boolean; error?: string } | null;
  if (!payload?.ok) {
    return { ok: false, error: payload?.error ?? "not_found_or_not_open" };
  }

  await revalidateApprovalSurfaces();

  return { ok: true };
}

export type CreateApprovalInput = {
  engagementId: string;
  target: "task" | "report";
  taskId: string | null;
  reportId: string | null;
  title: string;
  artifactLabel: string;
  submittedByLabel: string | null;
  risk: string;
};

export type CreateApprovalResult =
  | { ok: true; approvalId: string }
  | { ok: false; error: string };

export async function createApprovalRequest(
  input: CreateApprovalInput,
  actorLabel?: string | null,
): Promise<CreateApprovalResult> {
  const eng = input.engagementId?.trim() ?? "";
  if (!eng || !uuidRe.test(eng)) {
    return { ok: false, error: "invalid_engagement" };
  }

  const title = input.title?.trim() ?? "";
  const artifactLabel = input.artifactLabel?.trim() ?? "";
  if (!title || !artifactLabel) {
    return { ok: false, error: "empty_title_or_artifact" };
  }

  const riskRaw = (input.risk ?? "medium").trim().toLowerCase();
  if (!["low", "medium", "high"].includes(riskRaw)) {
    return { ok: false, error: "invalid_risk" };
  }

  let taskId: string | null = null;
  let reportId: string | null = null;

  if (input.target === "task") {
    const tid = input.taskId?.trim() ?? "";
    if (!tid || !uuidRe.test(tid)) {
      return { ok: false, error: "invalid_task" };
    }
    taskId = tid;
  } else {
    const rid = input.reportId?.trim() ?? "";
    if (!rid || !uuidRe.test(rid)) {
      return { ok: false, error: "invalid_report" };
    }
    reportId = rid;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { ok: false, error: "supabase_not_configured" };
  }

  const label = (actorLabel?.trim() || "Internal").slice(0, 200);
  const submittedBy = input.submittedByLabel?.trim() || null;

  const { data, error } = await supabase.rpc("admin_create_approval_request", {
    p_engagement_id: eng,
    p_task_id: taskId,
    p_report_artifact_id: reportId,
    p_title: title,
    p_artifact_label: artifactLabel,
    p_submitted_by_label: submittedBy,
    p_risk: riskRaw,
    p_actor_label: label,
  });

  if (error) {
    console.error("[createApprovalRequest]", error);
    return { ok: false, error: error.message };
  }

  const payload = data as { ok?: boolean; error?: string; approval_id?: string } | null;
  if (!payload?.ok || !payload.approval_id) {
    return { ok: false, error: payload?.error ?? "create_failed" };
  }

  await revalidateApprovalSurfaces();

  return { ok: true, approvalId: payload.approval_id };
}
