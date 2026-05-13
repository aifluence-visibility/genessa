"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

export type UpdateReportResult = { ok: true } | { ok: false; error: string };

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS = new Set([
  "draft",
  "internal_review",
  "client_ready",
  "delivered",
  "archived",
]);

function parseReportId(id: string): string | null {
  const t = id?.trim() ?? "";
  if (!t || !uuidRe.test(t)) {
    return null;
  }
  return t;
}

async function revalidateReportSurfaces() {
  revalidatePath("/admin/reports");
  revalidatePath("/admin/activity");
  revalidatePath("/admin/dashboard");
}

export async function updateAdminReport(
  reportId: string,
  status: string,
  actorLabel?: string | null,
): Promise<UpdateReportResult> {
  const id = parseReportId(reportId);
  if (!id) {
    return { ok: false, error: "invalid_id" };
  }

  const st = status?.trim().toLowerCase() ?? "";
  if (!STATUS.has(st)) {
    return { ok: false, error: "invalid_status" };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { ok: false, error: "supabase_not_configured" };
  }

  const label = (actorLabel?.trim() || "Internal").slice(0, 200);

  const { data, error } = await supabase.rpc("admin_update_report_artifact", {
    p_report_id: id,
    p_status: st,
    p_actor_label: label,
  });

  if (error) {
    console.error("[updateAdminReport]", error);
    return { ok: false, error: error.message };
  }

  const payload = data as { ok?: boolean; error?: string } | null;
  if (!payload?.ok) {
    return { ok: false, error: payload?.error ?? "not_found" };
  }

  await revalidateReportSurfaces();

  return { ok: true };
}
