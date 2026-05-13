import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { toDisplayDate } from "@/lib/db/admin/format";
import { mapLabel, sprintStatusLabel } from "@/lib/db/admin/labels";
import type { DataSource } from "@/lib/db/admin/labels";
import type { SprintRow } from "@/lib/admin/mock/sprints";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatPeriod(start: string | null, end: string | null): string {
  const a = toDisplayDate(start);
  const b = toDisplayDate(end);
  if (a === "—" && b === "—") return "—";
  return `${a} → ${b}`;
}

export async function getAdminSprints(
  engagementId?: string | null,
): Promise<{ source: DataSource; rows: SprintRow[] }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    const { mockSprints } = await import("@/lib/admin/mock/sprints");
    return { source: "mock", rows: mockSprints };
  }

  const eng = engagementId?.trim() ?? "";
  let q = supabase.from("sprints").select(
    `
      id,
      label,
      status,
      period_start,
      period_end,
      goals_summary,
      updated_at,
      engagement_id,
      engagements!inner (
        client_accounts!inner ( name )
      )
    `,
  );
  if (eng && uuidRe.test(eng)) {
    q = q.eq("engagement_id", eng);
  }
  const { data, error } = await q
    .order("period_start", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[admin] sprints query failed", error);
    const { mockSprints } = await import("@/lib/admin/mock/sprints");
    return { source: "mock", rows: mockSprints };
  }

  return {
    source: "database",
    rows: (data ?? []).map((row) => {
      const engagement = row.engagements as unknown as { client_accounts: { name: string } };
      return {
        id: row.id as string,
        engagementId: row.engagement_id as string,
        client: engagement.client_accounts?.name ?? "—",
        label: row.label as string,
        status: mapLabel(sprintStatusLabel, row.status as string, row.status) as SprintRow["status"],
        period: formatPeriod((row.period_start as string | null) ?? null, (row.period_end as string | null) ?? null),
        goals: (row.goals_summary as string | null) ?? "—",
        updatedAt: toDisplayDate(row.updated_at as string | null),
      };
    }),
  };
}
