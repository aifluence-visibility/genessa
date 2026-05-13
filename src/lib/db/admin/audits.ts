import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { toDisplayDate, toDisplaySector } from "@/lib/db/admin/format";
import { auditStatusLabel, mapLabel } from "@/lib/db/admin/labels";
import type { DataSource } from "@/lib/db/admin/labels";
import type { AuditRow } from "@/lib/admin/mock/audits";

export async function getAdminAudits(): Promise<{ source: DataSource; rows: AuditRow[] }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    const { mockAudits } = await import("@/lib/admin/mock/audits");
    return { source: "mock", rows: mockAudits };
  }

  const { data, error } = await supabase
    .from("audits")
    .select(
      `
      id,
      status,
      updated_at,
      users ( display_name ),
      engagements!inner (
        sector_pack_key,
        client_accounts!inner ( primary_domain )
      )
    `,
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[admin] audits query failed", error);
    const { mockAudits } = await import("@/lib/admin/mock/audits");
    return { source: "mock", rows: mockAudits };
  }

  return {
    source: "database",
    rows: (data ?? []).map((row) => {
      const engagement = row.engagements as unknown as {
        sector_pack_key: string | null;
        client_accounts: { primary_domain: string | null };
      };
      const users = row.users as unknown as { display_name: string | null } | null;
      return {
        id: row.id,
        domain: engagement.client_accounts?.primary_domain ?? "—",
        sector: toDisplaySector(engagement.sector_pack_key),
        status: mapLabel(auditStatusLabel, row.status, row.status) as AuditRow["status"],
        owner: users?.display_name ?? "Unassigned",
        updatedAt: toDisplayDate(row.updated_at),
      };
    }),
  };
}
