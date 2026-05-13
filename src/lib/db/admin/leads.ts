import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { toDisplayDate, toDisplaySector } from "@/lib/db/admin/format";
import type { DataSource } from "@/lib/db/admin/labels";
import type { LeadRow } from "@/lib/admin/mock/leads";

export async function getAdminLeads(): Promise<{ source: DataSource; rows: LeadRow[] }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    const { mockLeads } = await import("@/lib/admin/mock/leads");
    return { source: "mock", rows: mockLeads };
  }

  const { data, error } = await supabase
    .from("leads")
    .select("id,domain,sector,email,score_snapshot,audit_requested,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin] leads query failed", error);
    const { mockLeads } = await import("@/lib/admin/mock/leads");
    return { source: "mock", rows: mockLeads };
  }

  return {
    source: "database",
    rows: (data ?? []).map((r) => ({
      id: r.id,
      domain: r.domain,
      sector: toDisplaySector(r.sector),
      email: r.email ?? "—",
      score: typeof r.score_snapshot === "number" ? r.score_snapshot : 0,
      createdAt: toDisplayDate(r.created_at),
      auditRequested: Boolean(r.audit_requested),
    })),
  };
}
