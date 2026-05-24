"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Plan } from "@/lib/plan";
import { getPlanColor, getPlanLabel } from "@/lib/plan";

type UserRecord = {
  id: string;
  email: string;
  plan: Plan;
  sector: string | null;
  created_at: string;
  lastScan: string | null;
};

const PLAN_BG: Record<Plan, string> = {
  free: "#F3F4F6",
  premium: "#EDE9FE",
  agency: "#FEF3C7",
};

const PLANS: Plan[] = ["free", "premium", "agency"];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [changing, setChanging] = useState<string | null>(null);

  useEffect(() => {
    const secret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";
    fetch("/api/admin/users", { headers: { "x-admin-secret": secret } })
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSetPlan(userId: string, oldPlan: Plan, newPlan: Plan) {
    if (oldPlan === newPlan || changing) return;
    setChanging(userId);
    const secret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";
    const res = await fetch("/api/admin/set-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, userId, plan: newPlan }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u))
      );
    }
    setChanging(null);
  }

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalCount = users.length;
  const premiumCount = users.filter((u) => u.plan === "premium").length;
  const agencyCount = users.filter((u) => u.plan === "agency").length;

  const kpiCards = [
    { label: "TOPLAM KULLANICI", value: String(totalCount), hint: "Tüm kayıtlı kullanıcılar" },
    { label: "PREMIUM KULLANICI", value: String(premiumCount), hint: "Aktif premium hesaplar" },
    { label: "AGENCY KULLANICI", value: String(agencyCount), hint: "Aktif agency hesaplar" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--ink-900)]">Users</h1>
        <p className="mt-1 text-sm text-[var(--ink-500)]">Registered accounts and plan management.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--ink-0)] px-5 py-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--ink-500)]">
              {card.label}
            </p>
            <p className="mt-1 text-3xl font-bold text-[var(--ink-900)]">{card.value}</p>
            <p className="mt-0.5 text-xs text-[var(--ink-400)]">{card.hint}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Email ile ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-80 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 py-2 text-sm text-[var(--ink-800)] outline-none focus:ring-1 focus:ring-[var(--genessa-blue)]"
        />
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm text-[var(--ink-500)]">Yükleniyor...</p>
      ) : (
        <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--ink-0)]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--ink-50)]">
                {["Email", "Sektör", "Plan", "Kayıt Tarihi", "Son Scan", "İşlem"].map((h) => (
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-5 text-sm text-[var(--ink-400)]">
                    Kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-2.5 text-[var(--ink-800)]">{u.email}</td>
                    <td className="px-4 py-2.5 text-[var(--ink-600)]">{u.sector ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: PLAN_BG[u.plan],
                          color: getPlanColor(u.plan),
                        }}
                      >
                        {getPlanLabel(u.plan)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--ink-600)]">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-2.5 text-[var(--ink-600)]">{formatDate(u.lastScan)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {PLANS.map((p) => {
                          const isActive = u.plan === p;
                          return (
                            <button
                              key={p}
                              disabled={isActive || changing === u.id}
                              onClick={() => handleSetPlan(u.id, u.plan, p)}
                              style={{
                                padding: "3px 8px",
                                fontSize: "11px",
                                fontWeight: 600,
                                borderRadius: "var(--r-sm)",
                                border: "1px solid var(--border)",
                                cursor: isActive ? "default" : "pointer",
                                background: isActive ? "var(--ink-200)" : "var(--ink-0)",
                                color: isActive ? "var(--ink-800)" : "var(--ink-600)",
                                opacity: changing === u.id && !isActive ? 0.5 : 1,
                                transition: "background 0.15s",
                              }}
                            >
                              {getPlanLabel(p)}
                            </button>
                          );
                        })}
                        {u.plan === "agency" && (
                          <Link
                            href={`/admin/agency-clients/${u.id}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "4px 10px",
                              borderRadius: 6,
                              background: "#1F2937",
                              color: "#F59E0B",
                              fontSize: 12,
                              fontWeight: 500,
                              textDecoration: "none",
                              border: "1px solid #374151",
                            }}
                          >
                            👥 Clients
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
