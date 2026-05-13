import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { toDisplayDate } from "@/lib/db/admin/format";
import { mapLabel, reportStatusLabel, reportTypeLabel } from "@/lib/db/admin/labels";
import type { DataSource } from "@/lib/db/admin/labels";
import type { ReportRow } from "@/lib/admin/mock/reports";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getAdminReports(
  engagementId?: string | null,
): Promise<{ source: DataSource; rows: ReportRow[] }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    const { mockReports } = await import("@/lib/admin/mock/reports");
    return { source: "mock", rows: mockReports };
  }

  const eng = engagementId?.trim() ?? "";
  let q = supabase.from("report_artifacts").select(
    `
      id,
      title,
      report_type,
      version_label,
      status,
      updated_at,
      engagements!inner (
        client_accounts!inner ( name )
      )
    `,
  );
  if (eng && uuidRe.test(eng)) {
    q = q.eq("engagement_id", eng);
  }
  const { data, error } = await q.order("updated_at", { ascending: false });

  if (error) {
    console.error("[admin] reports query failed", error);
    const { mockReports } = await import("@/lib/admin/mock/reports");
    return { source: "mock", rows: mockReports };
  }

  return {
    source: "database",
    rows: (data ?? []).map((row) => {
      const engagement = row.engagements as unknown as { client_accounts: { name: string } };
      return {
        id: row.id,
        title: row.title,
        client: engagement.client_accounts?.name ?? "—",
        type: mapLabel(reportTypeLabel, row.report_type, row.report_type) as ReportRow["type"],
        version: row.version_label,
        status: mapLabel(reportStatusLabel, row.status, row.status) as ReportRow["status"],
        statusDb: row.status,
        updatedAt: toDisplayDate(row.updated_at),
      };
    }),
  };
}
