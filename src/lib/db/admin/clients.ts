import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { toDisplaySector } from "@/lib/db/admin/format";
import type { DataSource } from "@/lib/db/admin/labels";
import type { ClientRow } from "@/lib/admin/mock/clients";

export async function getAdminActiveClients(): Promise<{ source: DataSource; rows: ClientRow[] }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    const { mockClients } = await import("@/lib/admin/mock/clients");
    return { source: "mock", rows: mockClients };
  }

  const { data, error } = await supabase
    .from("engagements")
    .select(
      `
      id,
      sector_pack_key,
      roadmap_phase_label,
      current_sprint_label,
      client_accounts!inner (
        id,
        name,
        primary_domain,
        current_visibility_score
      )
    `,
    )
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin] active clients query failed", error);
    const { mockClients } = await import("@/lib/admin/mock/clients");
    return { source: "mock", rows: mockClients };
  }

  return {
    source: "database",
    rows: (data ?? []).map((row) => {
      const client = row.client_accounts as unknown as {
        id: string;
        name: string;
        primary_domain: string | null;
        current_visibility_score: number | null;
      };
      return {
        engagementId: row.id as string,
        id: client.id,
        name: client.name,
        domain: client.primary_domain ?? "—",
        sectorPack: toDisplaySector(row.sector_pack_key ?? client.name),
        score: typeof client.current_visibility_score === "number" ? client.current_visibility_score : 0,
        sprint: row.current_sprint_label ?? "—",
        roadmap: row.roadmap_phase_label ?? "—",
      };
    }),
  };
}
