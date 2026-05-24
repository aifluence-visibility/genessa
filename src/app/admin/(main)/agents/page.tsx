"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/admin/ui/stat-card";
import { Panel } from "@/components/admin/ui/panel";
import type {
  AgentSummary,
  TaskBreakdown,
  SectorCount,
  RecentError,
  AgentsAnalyticsResponse,
} from "@/app/api/admin/agents-analytics/route";

// Default agent names shown even when table is empty
const DEFAULT_AGENTS = ["technical", "content", "authority"];

function agentLabel(name: string): string {
  const map: Record<string, string> = {
    technical: "Technical Agent",
    content: "Content Agent",
    authority: "Authority Agent",
  };
  const lower = name.toLowerCase();
  return map[lower] ?? name.charAt(0).toUpperCase() + name.slice(1) + " Agent";
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function errorIndicator(errors: number): string {
  if (errors >= 10) return " 🔴";
  if (errors >= 5) return " ⚠️";
  return "";
}

function AgentCard({
  agentName,
  summary,
  tasks,
  sectors,
}: {
  agentName: string;
  summary: AgentSummary | null;
  tasks: TaskBreakdown[];
  sectors: SectorCount[];
}) {
  const isActive =
    summary?.lastRun != null
      ? Date.now() - new Date(summary.lastRun).getTime() < 24 * 60 * 60 * 1000
      : false;

  const successPct =
    summary && summary.successCount + summary.errorCount > 0
      ? Math.round((summary.successCount / (summary.successCount + summary.errorCount)) * 100)
      : null;

  return (
    <Panel>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--ink-900)]">{agentLabel(agentName)}</p>
          <p className="mt-0.5 text-xs text-[var(--ink-500)]">
            Son çalışma: {formatRelativeTime(summary?.lastRun ?? null)}
          </p>
        </div>
        <span
          className={`mt-0.5 flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isActive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-[var(--ink-50)] text-[var(--ink-500)]"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-[var(--ink-300)]"}`}
          />
          {isActive ? "Aktif" : "Beklemede"}
        </span>
      </div>

      {summary === null ? (
        <p className="mt-4 text-sm text-[var(--ink-400)]">Henüz çalışma kaydı yok.</p>
      ) : (
        <>
          {/* Stats row */}
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <span className="text-[var(--ink-500)]">
              Başarı:{" "}
              <span className="font-semibold text-[var(--ink-800)]">
                {successPct !== null ? `${successPct}%` : "—"}
              </span>
            </span>
            <span className="text-[var(--ink-500)]">
              Toplam:{" "}
              <span className="font-semibold text-[var(--ink-800)]">{summary.totalRuns}</span>
            </span>
            <span className="text-[var(--ink-500)]">
              Hata:{" "}
              <span
                className={`font-semibold ${summary.errorCount > 0 ? "text-red-600" : "text-[var(--ink-800)]"}`}
              >
                {summary.errorCount}
              </span>
            </span>
            <span className="text-[var(--ink-500)]">
              Ort. süre:{" "}
              <span className="font-semibold text-[var(--ink-800)]">
                {formatDuration(summary.avgDurationMs)}
              </span>
            </span>
          </div>

          {/* Sector pills */}
          {sectors.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sectors.map((s) => (
                <span
                  key={s.sector}
                  className="rounded-full bg-[var(--ink-100)] px-2.5 py-0.5 text-xs text-[var(--ink-600)]"
                >
                  {s.sector}
                </span>
              ))}
            </div>
          )}

          {/* Task breakdown */}
          {tasks.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-600)]">
                Görev Analizi
              </p>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="pb-1.5 pr-3 text-left font-medium text-[var(--ink-500)]">
                      Görev
                    </th>
                    <th className="pb-1.5 pr-3 text-right font-medium text-[var(--ink-500)]">
                      Çalışma
                    </th>
                    <th className="pb-1.5 pr-3 text-right font-medium text-[var(--ink-500)]">
                      Hata
                    </th>
                    <th className="pb-1.5 text-right font-medium text-[var(--ink-500)]">Süre</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr
                      key={t.taskTitle}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td
                        className="max-w-[160px] truncate py-1.5 pr-3 text-[var(--ink-700)]"
                        title={t.taskTitle}
                      >
                        {t.taskTitle}
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular-nums text-[var(--ink-600)]">
                        {t.total}
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">
                        <span
                          className={
                            t.errors > 0
                              ? "font-semibold text-red-600"
                              : "text-[var(--ink-600)]"
                          }
                        >
                          {t.errors}
                          {errorIndicator(t.errors)}
                        </span>
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-[var(--ink-600)]">
                        {formatDuration(t.avgMs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

export default function AdminAgentsPage() {
  const [data, setData] = useState<AgentsAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const secret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";
    fetch("/api/admin/agents-analytics", { headers: { "x-admin-secret": secret } })
      .then((r) => r.json())
      .then((d: AgentsAnalyticsResponse) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setFetchError(String(err));
        setLoading(false);
      });
  }, []);

  const kpi = data?.kpi;
  const agentSummaries = data?.agentSummaries ?? [];
  const taskBreakdowns = data?.taskBreakdowns ?? [];
  const sectorCounts = data?.sectorCounts ?? [];
  const recentErrors = data?.recentErrors ?? [];

  // Show cards for agents that have data, or fall back to 3 defaults if table empty
  const agentNames =
    agentSummaries.length > 0 ? agentSummaries.map((s) => s.agentName) : DEFAULT_AGENTS;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--ink-900)]">Agents</h1>
        <p className="mt-1 text-sm text-[var(--ink-500)]">
          Agent run analytics, error tracking, and task breakdown.
        </p>
      </div>

      {/* KPI Cards */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="AGENT RUNS (7 GÜN)"
          value={loading ? "—" : String(kpi?.totalRuns7d ?? 0)}
          hint="Son 7 günde toplam çalışma"
        />
        <StatCard
          label="BAŞARI ORANI"
          value={
            loading
              ? "—"
              : kpi?.successRatePct != null
                ? `${kpi.successRatePct}%`
                : "—"
          }
          hint="Tamamlanan çalışmalarda"
        />
        <StatCard
          label="EN ÇOK HATA"
          value={
            loading
              ? "—"
              : kpi?.mostErrorTask
                ? kpi.mostErrorTask.length > 18
                  ? kpi.mostErrorTask.slice(0, 18) + "…"
                  : kpi.mostErrorTask
                : "—"
          }
          hint="Hata sayısına göre üst görev"
        />
        <StatCard
          label="ORT. SÜRE"
          value={loading ? "—" : formatDuration(kpi?.avgDurationMs ?? null)}
          hint="Tüm çalışmaların ortalaması"
        />
      </section>

      {/* Agent Cards */}
      {loading ? (
        <p className="text-sm text-[var(--ink-500)]">Yükleniyor...</p>
      ) : fetchError ? (
        <p className="text-sm text-red-600">Veri yüklenemedi: {fetchError}</p>
      ) : (
        <section className="grid gap-5 lg:grid-cols-3">
          {agentNames.map((agentName) => (
            <AgentCard
              key={agentName}
              agentName={agentName}
              summary={agentSummaries.find((s) => s.agentName === agentName) ?? null}
              tasks={taskBreakdowns.filter((t) => t.agentName === agentName)}
              sectors={sectorCounts.filter((s) => s.agentName === agentName)}
            />
          ))}
        </section>
      )}

      {/* Recent Errors Table */}
      {!loading && (
        <div>
          <h2 className="mb-3 text-[15px] font-semibold text-[var(--ink-800)]">Son Hatalar</h2>
          <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--ink-0)]">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--ink-50)]">
                  {["Ajan", "Görev", "Sektör", "Hata Mesajı", "Tarih"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--ink-600)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentErrors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-5 text-sm text-[var(--ink-400)]">
                      Hata kaydı yok.
                    </td>
                  </tr>
                ) : (
                  recentErrors.map((e, i) => (
                    <tr
                      key={i}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 text-[var(--ink-700)]">
                        {agentLabel(e.agentName)}
                      </td>
                      <td
                        className="max-w-[180px] truncate px-4 py-2.5 text-[var(--ink-700)]"
                        title={e.taskTitle}
                      >
                        {e.taskTitle}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--ink-500)]">
                        {e.sector ?? "—"}
                      </td>
                      <td className="max-w-[280px] px-4 py-2.5 text-red-700">
                        <span title={e.errorMessage}>
                          {e.errorMessage.length > 80
                            ? e.errorMessage.slice(0, 80) + "..."
                            : e.errorMessage}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-[var(--ink-500)]">
                        {new Date(e.createdAt).toLocaleString("tr-TR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
