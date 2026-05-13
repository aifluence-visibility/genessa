import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { toDisplayDate } from "@/lib/db/admin/format";
import { mapLabel, proposalStatusLabel } from "@/lib/db/admin/labels";
import type { DataSource } from "@/lib/db/admin/labels";
import type { ProposalRow } from "@/lib/admin/mock/proposals";

export async function getAdminProposals(): Promise<{ source: DataSource; rows: ProposalRow[] }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    const { mockProposals } = await import("@/lib/admin/mock/proposals");
    return { source: "mock", rows: mockProposals };
  }

  const { data, error } = await supabase
    .from("proposals")
    .select(
      `
      id,
      status,
      duration_label,
      target_score,
      pricing_summary,
      updated_at,
      engagements!inner (
        client_accounts!inner ( name )
      )
    `,
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[admin] proposals query failed", error);
    const { mockProposals } = await import("@/lib/admin/mock/proposals");
    return { source: "mock", rows: mockProposals };
  }

  return {
    source: "database",
    rows: (data ?? []).map((row) => {
      const engagement = row.engagements as unknown as { client_accounts: { name: string } };
      return {
        id: row.id,
        client: engagement.client_accounts?.name ?? "—",
        duration: row.duration_label ?? "—",
        targetScore: typeof row.target_score === "number" ? row.target_score : 0,
        pricing: row.pricing_summary ?? "—",
        status: mapLabel(proposalStatusLabel, row.status, row.status) as ProposalRow["status"],
        updatedAt: toDisplayDate(row.updated_at),
      };
    }),
  };
}
