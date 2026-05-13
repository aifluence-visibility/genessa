import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { toDisplaySector } from "@/lib/db/admin/format";
import { mapLabel, taskApprovalLabel, taskPriorityLabel, taskStatusLabel } from "@/lib/db/admin/labels";
import type { DataSource } from "@/lib/db/admin/labels";
import type { TaskRow } from "@/lib/admin/mock/tasks";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getAdminTasks(
  engagementId?: string | null,
): Promise<{ source: DataSource; rows: TaskRow[] }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    const { mockTasks } = await import("@/lib/admin/mock/tasks");
    return { source: "mock", rows: mockTasks };
  }

  const eng = engagementId?.trim() ?? "";
  let q = supabase.from("tasks").select(
    `
      id,
      title,
      task_type,
      sector,
      priority,
      status,
      approval_state,
      output_summary,
      assignee_label
    `,
  );
  if (eng && uuidRe.test(eng)) {
    q = q.eq("engagement_id", eng);
  }
  const { data, error } = await q.order("updated_at", { ascending: false });

  if (error) {
    console.error("[admin] tasks query failed", error);
    const { mockTasks } = await import("@/lib/admin/mock/tasks");
    return { source: "mock", rows: mockTasks };
  }

  return {
    source: "database",
    rows: (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      taskType: row.task_type,
      sector: toDisplaySector(row.sector),
      priority: mapLabel(taskPriorityLabel, row.priority, row.priority) as TaskRow["priority"],
      status: mapLabel(taskStatusLabel, row.status, row.status) as TaskRow["status"],
      statusDb: row.status,
      assignedAgent: row.assignee_label ?? "Unassigned",
      output: row.output_summary ?? "—",
      approval: mapLabel(taskApprovalLabel, row.approval_state, row.approval_state) as TaskRow["approval"],
      approvalDb: row.approval_state,
    })),
  };
}
