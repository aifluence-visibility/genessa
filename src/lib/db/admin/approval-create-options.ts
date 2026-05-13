import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import type { DataSource } from "@/lib/db/admin/labels";
import type { AdminEngagementFilterOption } from "@/lib/db/admin/activity";

export type ApprovalTargetTaskOption = { id: string; label: string };
export type ApprovalTargetReportOption = { id: string; label: string };

export type ApprovalCreateFormData = {
  source: DataSource;
  engagements: AdminEngagementFilterOption[];
  /** Populated when `engagementId` is a valid UUID */
  tasks: ApprovalTargetTaskOption[];
  reports: ApprovalTargetReportOption[];
};

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getApprovalCreateFormData(engagementId?: string | null): Promise<ApprovalCreateFormData> {
  const engagementFilter =
    engagementId && uuidRe.test(engagementId.trim()) ? engagementId.trim() : null;

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { source: "mock", engagements: [], tasks: [], reports: [] };
  }

  const { data: engRows, error: engErr } = await supabase
    .from("engagements")
    .select(
      `
      id,
      roadmap_phase_label,
      client_accounts!inner ( name )
    `,
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(250);

  if (engErr) {
    console.error("[admin] approval create engagements", engErr);
    return { source: "mock", engagements: [], tasks: [], reports: [] };
  }

  const engagements: AdminEngagementFilterOption[] = (engRows ?? []).map((row) => {
    const ca = row.client_accounts as unknown as { name: string };
    const name = ca?.name ?? "—";
    const phase = row.roadmap_phase_label ? ` · ${row.roadmap_phase_label}` : "";
    return { id: row.id, label: `${name}${phase}` };
  });

  if (!engagementFilter) {
    return { source: "database", engagements, tasks: [], reports: [] };
  }

  const [tasksRes, reportsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, status")
      .eq("engagement_id", engagementFilter)
      .order("updated_at", { ascending: false })
      .limit(200),
    supabase
      .from("report_artifacts")
      .select("id, title, version_label, status")
      .eq("engagement_id", engagementFilter)
      .order("updated_at", { ascending: false })
      .limit(200),
  ]);

  if (tasksRes.error) {
    console.error("[admin] approval create tasks", tasksRes.error);
  }
  if (reportsRes.error) {
    console.error("[admin] approval create reports", reportsRes.error);
  }

  const tasks: ApprovalTargetTaskOption[] = (tasksRes.data ?? []).map((t) => ({
    id: t.id,
    label: `${t.title} · ${t.status}`,
  }));

  const reports: ApprovalTargetReportOption[] = (reportsRes.data ?? []).map((r) => ({
    id: r.id,
    label: `${r.title} · ${r.version_label} · ${r.status}`,
  }));

  return { source: "database", engagements, tasks, reports };
}
