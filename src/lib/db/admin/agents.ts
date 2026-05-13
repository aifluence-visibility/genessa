import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import type { DataSource } from "@/lib/db/admin/labels";
import type { AgentRow } from "@/lib/admin/mock/agents";
import { aggregateTasks, mockAgentRollupFromTasks } from "@/lib/admin/mock/agents";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getAdminAgents(
  engagementId?: string | null,
): Promise<{ source: DataSource; rows: AgentRow[] }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { source: "mock", rows: mockAgentRollupFromTasks() };
  }

  const eng = engagementId?.trim() ?? "";
  let q = supabase.from("tasks").select(
    `
      assignee_label,
      assignee_user_id,
      status,
      title,
      updated_at,
      users!tasks_assignee_user_id_fkey ( display_name )
    `,
  );
  if (eng && uuidRe.test(eng)) {
    q = q.eq("engagement_id", eng);
  }

  const { data, error } = await q.order("updated_at", { ascending: false });

  if (error) {
    console.error("[admin] agents query failed", error);
    return { source: "mock", rows: mockAgentRollupFromTasks() };
  }

  const rows = aggregateTasks(
    (data ?? []).map((row) => {
      const u = row.users as unknown as { display_name: string } | null;
      const rawUpdated = row.updated_at;
      const updated_at =
        typeof rawUpdated === "string"
          ? rawUpdated
          : rawUpdated != null
            ? new Date(rawUpdated as string | number).toISOString()
            : new Date().toISOString();
      return {
        assignee_label: row.assignee_label as string | null,
        assignee_user_id: row.assignee_user_id as string | null,
        status: row.status as string,
        title: row.title as string,
        updated_at,
        user_display: u?.display_name ?? null,
      };
    }),
  );

  return { source: "database", rows };
}
