import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

export type AgentSummary = {
  agentName: string;
  totalRuns: number;
  successCount: number;
  errorCount: number;
  avgDurationMs: number | null;
  lastRun: string | null;
};

export type TaskBreakdown = {
  agentName: string;
  taskTitle: string;
  total: number;
  errors: number;
  avgMs: number | null;
};

export type SectorCount = {
  agentName: string;
  sector: string;
  count: number;
};

export type RecentError = {
  agentName: string;
  taskTitle: string;
  sector: string | null;
  errorMessage: string;
  createdAt: string;
};

export type AgentsAnalyticsResponse = {
  kpi: {
    totalRuns7d: number;
    successRatePct: number | null;
    mostErrorTask: string | null;
    avgDurationMs: number | null;
  };
  agentSummaries: AgentSummary[];
  taskBreakdowns: TaskBreakdown[];
  sectorCounts: SectorCount[];
  recentErrors: RecentError[];
};

type RunRow = {
  id: string;
  status: string;
  task_type_snapshot: string | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  tasks: { title: string; sector: string | null } | null;
};

export async function GET(req: Request) {
  if (req.headers.get("x-admin-secret") !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Admin client not configured" }, { status: 500 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("agent_runs")
    .select(`id, status, task_type_snapshot, error_message, started_at, finished_at, created_at, tasks ( title, sector )`)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const allRuns = (data ?? []) as unknown as RunRow[];

  // KPI: total runs in last 7 days
  const totalRuns7d = allRuns.filter((r) => r.created_at >= sevenDaysAgo).length;

  // KPI: overall success rate (succeeded vs failed only)
  const finishedRuns = allRuns.filter((r) => r.status === "succeeded" || r.status === "failed");
  const succeededTotal = finishedRuns.filter((r) => r.status === "succeeded").length;
  const successRatePct =
    finishedRuns.length > 0 ? Math.round((succeededTotal / finishedRuns.length) * 100) : null;

  // KPI: avg duration across all runs that have both timestamps
  const allDurations = allRuns
    .filter((r) => r.started_at && r.finished_at)
    .map((r) => new Date(r.finished_at!).getTime() - new Date(r.started_at!).getTime())
    .filter((d) => d >= 0);
  const avgDurationMs =
    allDurations.length > 0
      ? Math.round(allDurations.reduce((a, b) => a + b, 0) / allDurations.length)
      : null;

  // Per-agent summary grouped by task_type_snapshot
  const agentMap = new Map<
    string,
    { totalRuns: number; successCount: number; errorCount: number; durations: number[]; lastRun: string | null }
  >();
  for (const r of allRuns) {
    const name = r.task_type_snapshot?.trim() || "unknown";
    if (!agentMap.has(name)) {
      agentMap.set(name, { totalRuns: 0, successCount: 0, errorCount: 0, durations: [], lastRun: null });
    }
    const e = agentMap.get(name)!;
    e.totalRuns++;
    if (r.status === "succeeded") e.successCount++;
    if (r.status === "failed") e.errorCount++;
    if (r.started_at && r.finished_at) {
      const d = new Date(r.finished_at).getTime() - new Date(r.started_at).getTime();
      if (d >= 0) e.durations.push(d);
    }
    if (!e.lastRun || r.created_at > e.lastRun) e.lastRun = r.created_at;
  }

  const agentSummaries: AgentSummary[] = Array.from(agentMap.entries())
    .map(([agentName, v]) => ({
      agentName,
      totalRuns: v.totalRuns,
      successCount: v.successCount,
      errorCount: v.errorCount,
      avgDurationMs:
        v.durations.length > 0
          ? Math.round(v.durations.reduce((a, b) => a + b, 0) / v.durations.length)
          : null,
      lastRun: v.lastRun,
    }))
    .sort((a, b) => b.totalRuns - a.totalRuns);

  // Task breakdown grouped by (task_type_snapshot, task title)
  const taskMap = new Map<
    string,
    { agentName: string; taskTitle: string; total: number; errors: number; durations: number[] }
  >();
  for (const r of allRuns) {
    const agentName = r.task_type_snapshot?.trim() || "unknown";
    const taskTitle = r.tasks?.title ?? "—";
    const key = `${agentName}\x00${taskTitle}`;
    if (!taskMap.has(key)) {
      taskMap.set(key, { agentName, taskTitle, total: 0, errors: 0, durations: [] });
    }
    const e = taskMap.get(key)!;
    e.total++;
    if (r.status === "failed") e.errors++;
    if (r.started_at && r.finished_at) {
      const d = new Date(r.finished_at).getTime() - new Date(r.started_at).getTime();
      if (d >= 0) e.durations.push(d);
    }
  }

  const taskBreakdowns: TaskBreakdown[] = Array.from(taskMap.values())
    .map((v) => ({
      agentName: v.agentName,
      taskTitle: v.taskTitle,
      total: v.total,
      errors: v.errors,
      avgMs:
        v.durations.length > 0
          ? Math.round(v.durations.reduce((a, b) => a + b, 0) / v.durations.length)
          : null,
    }))
    .sort((a, b) => b.errors - a.errors || a.agentName.localeCompare(b.agentName));

  // KPI: task name with highest error count
  const mostErrorTask =
    taskBreakdowns.length > 0 && taskBreakdowns[0].errors > 0 ? taskBreakdowns[0].taskTitle : null;

  // Sector distribution grouped by (task_type_snapshot, sector)
  const sectorMapByAgent = new Map<string, Map<string, number>>();
  for (const r of allRuns) {
    const agentName = r.task_type_snapshot?.trim() || "unknown";
    const sector = r.tasks?.sector;
    if (!sector) continue;
    if (!sectorMapByAgent.has(agentName)) sectorMapByAgent.set(agentName, new Map());
    const m = sectorMapByAgent.get(agentName)!;
    m.set(sector, (m.get(sector) ?? 0) + 1);
  }

  const sectorCounts: SectorCount[] = [];
  for (const [agentName, sectors] of sectorMapByAgent.entries()) {
    for (const [sector, count] of sectors.entries()) {
      sectorCounts.push({ agentName, sector, count });
    }
  }
  sectorCounts.sort((a, b) => a.agentName.localeCompare(b.agentName) || b.count - a.count);

  // Recent errors (last 20 failed runs with error_message)
  const recentErrors: RecentError[] = allRuns
    .filter((r) => r.status === "failed" && r.error_message)
    .slice(0, 20)
    .map((r) => ({
      agentName: r.task_type_snapshot?.trim() || "unknown",
      taskTitle: r.tasks?.title ?? "—",
      sector: r.tasks?.sector ?? null,
      errorMessage: r.error_message!,
      createdAt: r.created_at,
    }));

  const response: AgentsAnalyticsResponse = {
    kpi: { totalRuns7d, successRatePct, mostErrorTask, avgDurationMs },
    agentSummaries,
    taskBreakdowns,
    sectorCounts,
    recentErrors,
  };

  return NextResponse.json(response);
}
