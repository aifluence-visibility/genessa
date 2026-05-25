"use client";

import { useState, useEffect, useCallback } from "react";
import type { Plan } from "@/lib/plan";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserRecord {
  id: string;
  email: string;
  plan: Plan;
  sector: string | null;
  created_at: string;
}

interface ScanStat {
  date: string;
  count: number;
}

type PlanDist = Record<Plan, number>;

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<Plan, string> = {
  free:       "#6B7280",
  starter:    "#3B82F6",
  pro:        "#8B5CF6",
  agency:     "#F59E0B",
  consulting: "#10B981",
};

const PLAN_BG: Record<Plan, string> = {
  free:       "rgba(107,114,128,0.15)",
  starter:    "rgba(59,130,246,0.15)",
  pro:        "rgba(139,92,246,0.15)",
  agency:     "rgba(245,158,11,0.15)",
  consulting: "rgba(16,185,129,0.15)",
};

// ─── Plan badge ───────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: Plan }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 999,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        background: PLAN_BG[plan],
        color: PLAN_COLORS[plan],
        border: `1px solid ${PLAN_COLORS[plan]}44`,
      }}
    >
      {plan}
    </span>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KPICard({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        padding: "20px 22px",
        borderRadius: 14,
        background: "#1A1F2E",
        border: "1px solid #2A3040",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "#6B7280",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          letterSpacing: "-0.04em",
          color: loading ? "#374151" : "#F9FAFB",
        }}
      >
        {loading ? "—" : value}
      </div>
    </div>
  );
}

// ─── Scan bar chart ────────────────────────────────────────────────────────────

function ScanBarChart({ stats }: { stats: ScanStat[] }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const bars = days.map((date) => ({
    date,
    count: stats.find((s) => s.date === date)?.count ?? 0,
    label: new Date(date + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "short" }),
  }));

  const maxCount = Math.max(...bars.map((b) => b.count), 1);
  const BAR_MAX_H = 80;

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: BAR_MAX_H + 36 }}>
      {bars.map(({ date, count, label }) => (
        <div
          key={date}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
        >
          <div style={{ fontSize: 11, color: "#9CA3AF", minHeight: 16 }}>
            {count > 0 ? count : ""}
          </div>
          <div
            style={{
              width: "100%",
              height: count === 0 ? 4 : Math.max((count / maxCount) * BAR_MAX_H, 8),
              background:
                count === 0
                  ? "#2A3040"
                  : "linear-gradient(to top, #2952E3, #7B3FE4)",
              borderRadius: 4,
              transition: "height 500ms cubic-bezier(0.32, 0, 0.67, 0)",
            }}
          />
          <div style={{ fontSize: 11, color: "#6B7280" }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── User table row ───────────────────────────────────────────────────────────

function UserTableRow({
  user,
  onSetPlan,
}: {
  user: UserRecord;
  onSetPlan: (userId: string, oldPlan: Plan, newPlan: Plan) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNote(localStorage.getItem(`admin_note_${user.id}`) ?? "");
  }, [user.id]);

  function handleNoteBlur() {
    localStorage.setItem(`admin_note_${user.id}`, note);
  }

  async function handlePlanClick(newPlan: Plan) {
    if (user.plan === newPlan || saving) return;
    setSaving(true);
    await onSetPlan(user.id, user.plan, newPlan);
    setSaving(false);
  }

  const created = new Date(user.created_at).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <tr
      style={{
        borderBottom: "1px solid #222835",
        transition: "background 100ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background = "#1E2435";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background = "";
      }}
    >
      <td style={{ padding: "11px 18px", fontSize: 13, color: "#D1D5DB", maxWidth: 240 }}>
        <div
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={user.email}
        >
          {user.email}
        </div>
      </td>
      <td style={{ padding: "11px 18px", fontSize: 12, color: "#9CA3AF" }}>
        {user.sector ?? <span style={{ color: "#4B5563" }}>—</span>}
      </td>
      <td style={{ padding: "11px 18px" }}>
        <PlanBadge plan={user.plan} />
      </td>
      <td
        style={{
          padding: "11px 18px",
          fontSize: 12,
          color: "#9CA3AF",
          whiteSpace: "nowrap",
        }}
      >
        {created}
      </td>
      <td style={{ padding: "11px 18px" }}>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleNoteBlur}
          placeholder="Not ekle..."
          style={{
            background: "#111827",
            border: "1.5px solid #2A3040",
            borderRadius: 7,
            padding: "5px 9px",
            color: "#D1D5DB",
            fontSize: 12,
            fontFamily: "inherit",
            outline: "none",
            width: 150,
          }}
        />
      </td>
      <td style={{ padding: "11px 18px" }}>
        <div style={{ display: "flex", gap: 5 }}>
          {(["free", "premium", "agency"] as Plan[]).map((plan) => {
            const isActive = user.plan === plan;
            return (
              <button
                key={plan}
                disabled={isActive || saving}
                onClick={() => handlePlanClick(plan)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 7,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: isActive || saving ? "default" : "pointer",
                  border: `1.5px solid ${isActive ? PLAN_COLORS[plan] : "#374151"}`,
                  background: isActive ? PLAN_BG[plan] : "transparent",
                  color: isActive ? PLAN_COLORS[plan] : "#6B7280",
                  opacity: saving ? 0.5 : 1,
                  fontFamily: "inherit",
                  textTransform: "capitalize",
                  transition: "opacity 100ms",
                }}
              >
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </button>
            );
          })}
        </div>
      </td>
    </tr>
  );
}

// ─── Admin login ──────────────────────────────────────────────────────────────

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === process.env.NEXT_PUBLIC_ADMIN_SECRET) {
      localStorage.setItem("admin_token", pw);
      onSuccess();
    } else {
      setError(true);
      setPw("");
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        background: "#0F1117",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#1A1F2E",
          border: "1px solid #2A3040",
          borderRadius: 16,
          padding: "36px 32px",
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#F9FAFB",
            margin: "0 0 6px",
            letterSpacing: "-0.025em",
          }}
        >
          Admin Girişi
        </h1>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 28px" }}>
          Genessa müşteri paneline erişim
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pw}
            autoFocus
            onChange={(e) => {
              setPw(e.target.value);
              setError(false);
            }}
            placeholder="Şifre"
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: 10,
              background: "#111827",
              border: error ? "1.5px solid #EF4444" : "1.5px solid #374151",
              color: "#F9FAFB",
              fontSize: 14,
              marginBottom: error ? 8 : 12,
              fontFamily: "inherit",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
          {error && (
            <p style={{ fontSize: 12, color: "#EF4444", margin: "0 0 10px" }}>
              Hatalı şifre
            </p>
          )}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Giriş
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminCustomersPage() {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [scanStats, setScanStats] = useState<ScanStat[]>([]);
  const [planDist, setPlanDist] = useState<PlanDist>({ free: 0, starter: 0, pro: 0, agency: 0, consulting: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token === process.env.NEXT_PUBLIC_ADMIN_SECRET) {
      setAuthed(true);
    }
    setChecked(true);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const secret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";
    const headers = { "x-admin-secret": secret };
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch("/api/admin/users", { headers }),
        fetch("/api/admin/stats", { headers }),
      ]);
      const ud = (await usersRes.json()) as { users?: UserRecord[] };
      const sd = (await statsRes.json()) as {
        scanStats?: ScanStat[];
        planDist?: PlanDist;
      };
      setUsers(ud.users ?? []);
      setScanStats(sd.scanStats ?? []);
      setPlanDist(sd.planDist ?? { free: 0, starter: 0, pro: 0, agency: 0, consulting: 0 });
    } catch (err) {
      console.error("Admin data load failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadData();
  }, [authed, loadData]);

  async function handleSetPlan(userId: string, oldPlan: Plan, newPlan: Plan) {
    try {
      const res = await fetch("/api/admin/set-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: process.env.NEXT_PUBLIC_ADMIN_SECRET,
          userId,
          plan: newPlan,
        }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u))
        );
        setPlanDist((prev) => ({
          ...prev,
          [oldPlan]: Math.max(0, (prev[oldPlan] ?? 0) - 1),
          [newPlan]: (prev[newPlan] ?? 0) + 1,
        }));
      }
    } catch (err) {
      console.error("Set plan failed:", err);
    }
  }

  if (!checked) return null;

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />;
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayScans = scanStats.find((s) => s.date === today)?.count ?? 0;
  const totalUsers = users.length;
  const premiumUsers = users.filter((u) => u.plan === "starter" || u.plan === "pro").length;
  const agencyUsers = users.filter((u) => u.plan === "agency").length;

  const filtered = search
    ? users.filter((u) =>
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F1117",
        color: "#F9FAFB",
        padding: "32px 40px 80px",
        fontFamily: "inherit",
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        zIndex: 10,
      }}
    >
      <style>{`
        input[type="search"]::-webkit-search-cancel-button { display: none; }
        input::placeholder { color: #4B5563; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            margin: "0 0 4px",
            color: "#F9FAFB",
          }}
        >
          Müşteri Kontrolü
        </h1>
        <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
          Genessa admin paneli — kullanıcı ve plan yönetimi
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display: "flex", gap: 14, marginBottom: 32 }}>
        <KPICard label="Toplam Kullanıcı" value={totalUsers} loading={loading} />
        <KPICard label="Premium Kullanıcı" value={premiumUsers} loading={loading} />
        <KPICard label="Agency Kullanıcı" value={agencyUsers} loading={loading} />
        <KPICard label="Bugün Scan" value={todayScans} loading={loading} />
      </div>

      {/* User table */}
      <section
        style={{
          background: "#1A1F2E",
          border: "1px solid #2A3040",
          borderRadius: 14,
          marginBottom: 32,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 22px",
            borderBottom: "1px solid #2A3040",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "#F9FAFB" }}>
            Kullanıcılar{!loading && users.length > 0 ? ` (${users.length})` : ""}
          </div>
          <input
            type="search"
            placeholder="Email ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              background: "#111827",
              border: "1.5px solid #374151",
              color: "#F9FAFB",
              fontSize: 13,
              width: 240,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#141820" }}>
                {["Email", "Sektör", "Plan", "Kayıt Tarihi", "Not", "İşlem"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 18px",
                        textAlign: "left",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#6B7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        borderBottom: "1px solid #2A3040",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "48px",
                      textAlign: "center",
                      color: "#6B7280",
                      fontSize: 14,
                    }}
                  >
                    Yükleniyor...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "48px",
                      textAlign: "center",
                      color: "#6B7280",
                      fontSize: 14,
                    }}
                  >
                    {search ? "Kullanıcı bulunamadı" : "Henüz kullanıcı yok"}
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <UserTableRow
                    key={user.id}
                    user={user}
                    onSetPlan={handleSetPlan}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Scan bar chart */}
      <section
        style={{
          background: "#1A1F2E",
          border: "1px solid #2A3040",
          borderRadius: 14,
          padding: "22px 26px",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#F9FAFB",
            marginBottom: 4,
          }}
        >
          Son 7 Günlük Scan
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 22 }}>
          Günlük tarama aktivitesi
        </div>
        <ScanBarChart stats={scanStats} />
      </section>
    </div>
  );
}
