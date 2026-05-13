import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { formatRelativeTime, toDisplayDate, toDisplaySector } from "@/lib/db/admin/format";
import { auditStatusLabel, mapLabel } from "@/lib/db/admin/labels";
import type { DataSource } from "@/lib/db/admin/labels";
import type { ActivityItem, DashboardStat } from "@/lib/admin/mock/dashboard";
import type { AuditRow } from "@/lib/admin/mock/audits";

type DashboardPayload = {
  source: DataSource;
  stats: DashboardStat[];
  recentActivity: ActivityItem[];
  auditsPreview: AuditRow[];
};

const activityTypes = new Set<ActivityItem["type"]>(["audit", "approval", "lead", "task", "engagement", "report"]);

function normalizeActivityType(raw: string): ActivityItem["type"] {
  return activityTypes.has(raw as ActivityItem["type"]) ? (raw as ActivityItem["type"]) : "task";
}

export async function getAdminDashboardData(): Promise<DashboardPayload> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    const [{ dashboardStats, recentActivity }, { mockAudits }] = await Promise.all([
      import("@/lib/admin/mock/dashboard"),
      import("@/lib/admin/mock/audits"),
    ]);
    return {
      source: "mock",
      stats: dashboardStats,
      recentActivity,
      auditsPreview: mockAudits.slice(0, 4),
    };
  }

  const [
    engagementsRes,
    openApprovalsRes,
    highRiskOpenRes,
    auditsRes,
    tasksRes,
    activityRes,
    auditsListRes,
    clientsRes,
    agentPendingRes,
    agentRunningRes,
    agentFinished24hRes,
  ] = await Promise.all([
    supabase.from("engagements").select("client_account_id,metadata").eq("status", "active").is("deleted_at", null),
    supabase.from("approval_requests").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("approval_requests").select("id", { count: "exact", head: true }).eq("status", "open").eq("risk", "high"),
    supabase
      .from("audits")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "in_progress", "waiting_review"]),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .in("status", ["todo", "in_progress", "blocked"]),
    supabase.from("activity_events").select("id,event_type,title,detail,created_at").order("created_at", { ascending: false }).limit(15),
    supabase
      .from("audits")
      .select(
        `
        id,
        status,
        updated_at,
        owner_user_id,
        users ( display_name ),
        engagements!inner (
          sector_pack_key,
          client_accounts!inner (
            primary_domain
          )
        )
      `,
      )
      .order("updated_at", { ascending: false })
      .limit(4),
    supabase.from("client_accounts").select("current_visibility_score").is("deleted_at", null),
    supabase.from("agent_runs").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("agent_runs").select("id", { count: "exact", head: true }).eq("status", "running"),
    supabase
      .from("agent_runs")
      .select("id", { count: "exact", head: true })
      .in("status", ["succeeded", "failed", "cancelled"])
      .gte("finished_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const engagementRows = engagementsRes.data ?? [];
  const activeClientCount = new Set(engagementRows.map((r) => r.client_account_id)).size;

  const pendingApprovals = openApprovalsRes.count ?? 0;
  const highRiskOpen = highRiskOpenRes.count ?? 0;

  const activeAudits = auditsRes.count ?? 0;
  const runningTasks = tasksRes.count ?? 0;

  const sprintPercents = engagementRows
    .map((r) => {
      const raw = r.metadata as { ui?: { sprint_progress_pct?: number } } | null;
      const pct = raw?.ui?.sprint_progress_pct;
      return typeof pct === "number" ? pct : null;
    })
    .filter((n): n is number => n !== null);
  const sprintProgress =
    sprintPercents.length > 0 ? Math.round(sprintPercents.reduce((a, b) => a + b, 0) / sprintPercents.length) : null;

  const scores = (clientsRes.data ?? [])
    .map((c) => c.current_visibility_score)
    .filter((n): n is number => typeof n === "number");
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  const auditsPreview: AuditRow[] = (auditsListRes.data ?? []).map((row) => {
    const engagement = row.engagements as unknown as {
      sector_pack_key: string | null;
      client_accounts: { primary_domain: string | null };
    };
    const users = row.users as unknown as { display_name: string | null } | null;
    const domain = engagement.client_accounts?.primary_domain ?? "—";
    const sector = toDisplaySector(engagement.sector_pack_key);
    const owner = users?.display_name ?? "Unassigned";
    return {
      id: row.id,
      domain,
      sector,
      status: mapLabel(auditStatusLabel, row.status, row.status) as AuditRow["status"],
      owner,
      updatedAt: toDisplayDate(row.updated_at),
    };
  });

  const recentActivity: ActivityItem[] = (activityRes.data ?? []).map((ev) => ({
    id: ev.id,
    title: ev.title,
    detail: ev.detail ?? "",
    time: formatRelativeTime(ev.created_at),
    type: normalizeActivityType(ev.event_type),
  }));

  const agentPending = agentPendingRes.count ?? 0;
  const agentRunning = agentRunningRes.count ?? 0;
  const agentFinished24h = agentFinished24hRes.count ?? 0;

  const stats: DashboardStat[] = [
    { label: "Active clients", value: String(activeClientCount), hint: "Distinct clients with an active engagement" },
    {
      label: "Pending approvals",
      value: String(pendingApprovals),
      hint: highRiskOpen ? `${highRiskOpen} high risk` : undefined,
    },
    { label: "Active audits", value: String(activeAudits), hint: "Excludes completed / cancelled" },
    { label: "Running tasks", value: String(runningTasks), hint: "Todo · in progress · blocked" },
    {
      label: "Sprint progress",
      value: sprintProgress === null ? "—" : `${sprintProgress}%`,
      hint: "Average of engagement metadata hints",
    },
    {
      label: "Avg. AI visibility",
      value: avgScore === null ? "—" : String(avgScore),
      hint: "Mean of client_visibility_score on accounts",
    },
    {
      label: "Agent queue",
      value: String(agentPending),
      hint: agentRunning ? `${agentRunning} running now` : "Pending worker claims",
    },
    {
      label: "Agent runs · 24h",
      value: String(agentFinished24h),
      hint: "Succeeded / failed / cancelled with finished_at",
    },
  ];

  return { source: "database", stats, recentActivity, auditsPreview };
}
