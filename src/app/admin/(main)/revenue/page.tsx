"use client";

import { useEffect, useState } from "react";

type PlanDist = {
  free?: number;
  starter?: number;
  pro?: number;
  agency?: number;
  consulting?: number;
};

const PLAN_PRICES = {
  starter: { monthly: 29,  yearly: 23 * 12 },
  pro:     { monthly: 79,  yearly: 63 * 12 },
};

type PaymentRecord = {
  id: string;
  email: string;
  plan: "free" | "starter" | "pro" | "agency" | "consulting";
  billing: "monthly" | "yearly";
  amount: number;
  date: string;
  note: string;
};

function loadRecords(): PaymentRecord[] {
  try {
    return JSON.parse(localStorage.getItem("revenue_records") ?? "[]");
  } catch {
    return [];
  }
}

function saveRecords(records: PaymentRecord[]) {
  localStorage.setItem("revenue_records", JSON.stringify(records));
}

const inputStyle: React.CSSProperties = {
  padding: "7px 10px",
  fontSize: "13px",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-md)",
  background: "var(--ink-0)",
  color: "var(--ink-800)",
  outline: "none",
};

const PLAN_BADGE: Record<string, { bg: string; color: string }> = {
  free:       { bg: "#F3F4F6", color: "#6B7280" },
  starter:    { bg: "#EFF6FF", color: "#3B82F6" },
  pro:        { bg: "#EDE9FE", color: "#8B5CF6" },
  agency:     { bg: "#FEF3C7", color: "#F59E0B" },
  consulting: { bg: "#D1FAE5", color: "#10B981" },
};

export default function AdminRevenuePage() {
  const [planDist, setPlanDist] = useState<PlanDist>({});
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [planSyncMsg, setPlanSyncMsg] = useState<string | null>(null);

  const [form, setForm] = useState<{
    email: string;
    plan: PaymentRecord["plan"];
    billing: PaymentRecord["billing"];
    amount: number;
    date: string;
    note: string;
  }>({
    email: "",
    plan: "starter",
    billing: "monthly",
    amount: PLAN_PRICES.starter.monthly,
    date: new Date().toISOString().slice(0, 10),
    note: "",
  });

  useEffect(() => {
    setRecords(loadRecords());
    const secret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";
    fetch("/api/admin/stats", { headers: { "x-admin-secret": secret } })
      .then((r) => r.json())
      .then((data) => {
        if (data.planDist) setPlanDist(data.planDist as PlanDist);
      })
      .catch(() => {});
  }, []);

  async function addRecord() {
    if (!form.email.trim()) return;
    const record: PaymentRecord = {
      id: Date.now().toString(),
      email: form.email.trim(),
      plan: form.plan,
      billing: form.billing,
      amount: Number(form.amount),
      date: form.date,
      note: form.note,
    };
    const updated = [record, ...records];
    setRecords(updated);
    saveRecords(updated);
    const emailSnap = form.email.trim();
    const planSnap = form.plan;
    setForm({
      email: "",
      plan: "starter",
      billing: "monthly",
      amount: PLAN_PRICES.starter.monthly,
      date: new Date().toISOString().slice(0, 10),
      note: "",
    });
    setPlanSyncMsg(null);

    try {
      const secret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";
      const usersRes = await fetch("/api/admin/users", { headers: { "x-admin-secret": secret } });
      const usersData = await usersRes.json();
      const found = (usersData.users ?? []).find((u: { email: string; id: string }) => u.email === emailSnap);
      if (!found) {
        setPlanSyncMsg("✅ Payment recorded (user not found — update plan manually)");
        return;
      }
      const planRes = await fetch("/api/admin/set-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, userId: found.id, plan: planSnap }),
      });
      if (planRes.ok) {
        setPlanSyncMsg("✅ Payment recorded & plan activated");
      } else {
        setPlanSyncMsg("✅ Payment recorded (plan update failed — update manually)");
      }
    } catch {
      setPlanSyncMsg("✅ Payment recorded (plan update failed — update manually)");
    }
  }

  function deleteRecord(id: string) {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    saveRecords(updated);
  }

  const free       = planDist.free ?? 0;
  const starter    = planDist.starter ?? 0;
  const pro        = planDist.pro ?? 0;

  const starterRevenue = starter * PLAN_PRICES.starter.monthly;
  const proRevenue     = pro     * PLAN_PRICES.pro.monthly;

  const manualAgencyRevenue = records
    .filter((r) => r.plan === "agency" || r.plan === "consulting")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalRevenue = starterRevenue + proRevenue + manualAgencyRevenue;

  const kpiCards = [
    { label: "FREE USERS",   value: String(free),           hint: "$0/mo" },
    { label: "STARTER USERS",value: String(starter),        hint: `$${starterRevenue}/mo @ $${PLAN_PRICES.starter.monthly}` },
    { label: "PRO USERS",    value: String(pro),             hint: `$${proRevenue}/mo @ $${PLAN_PRICES.pro.monthly}` },
    { label: "AGENCY + CONSULTING", value: `$${manualAgencyRevenue}`, hint: "From manual records" },
    { label: "ESTIMATED REVENUE",   value: `$${totalRevenue}`,        hint: "Total MRR/mo" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--ink-900)]">Revenue</h1>
        <p className="mt-1 text-sm text-[var(--ink-500)]">
          Estimated MRR from plan distribution + manual payment records.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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

      {/* Payment Records Table */}
      <div>
        <h2 className="mb-3 text-[15px] font-semibold text-[var(--ink-800)]">Payment Records</h2>
        <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--ink-0)]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--ink-50)]">
                {["Email", "Plan", "Billing", "Amount", "Date", "Note", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--ink-600)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-5 text-sm text-[var(--ink-400)]">
                    No records yet.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const badge = PLAN_BADGE[r.plan] ?? PLAN_BADGE.free;
                  return (
                    <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-4 py-2.5 text-[var(--ink-800)]">{r.email}</td>
                      <td className="px-4 py-2.5">
                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 9999, fontSize: 12, fontWeight: 600, background: badge.bg, color: badge.color }}>
                          {r.plan.charAt(0).toUpperCase() + r.plan.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 capitalize text-[var(--ink-600)]">{r.billing}</td>
                      <td className="px-4 py-2.5 font-semibold text-[var(--ink-800)]">${r.amount}</td>
                      <td className="px-4 py-2.5 text-[var(--ink-600)]">{r.date}</td>
                      <td className="px-4 py-2.5 text-[var(--ink-500)]">{r.note || "—"}</td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => deleteRecord(r.id)}
                          style={{ padding: "3px 8px", fontSize: 11, border: "1px solid #FCA5A5", borderRadius: "var(--r-sm)", background: "#FEF2F2", color: "#EF4444", cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Form */}
      <div>
        <h2 className="mb-3 text-[15px] font-semibold text-[var(--ink-800)]">Add Payment</h2>
        <div
          className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--ink-0)] p-5"
          style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", color: "var(--ink-500)", fontWeight: 500 }}>Email</label>
            <input
              type="email"
              placeholder="user@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              style={{ ...inputStyle, width: "220px" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", color: "var(--ink-500)", fontWeight: 500 }}>Plan</label>
            <select
              value={form.plan}
              onChange={(e) => {
                const p = e.target.value as PaymentRecord["plan"];
                const defaultAmount =
                  p === "starter" ? PLAN_PRICES.starter.monthly :
                  p === "pro"     ? PLAN_PRICES.pro.monthly : 0;
                setForm((f) => ({ ...f, plan: p, amount: defaultAmount }));
              }}
              style={{ ...inputStyle, width: "130px" }}
            >
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="agency">Agency</option>
              <option value="consulting">Consulting</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", color: "var(--ink-500)", fontWeight: 500 }}>Billing</label>
            <select
              value={form.billing}
              onChange={(e) => {
                const b = e.target.value as "monthly" | "yearly";
                const prices = form.plan === "starter" ? PLAN_PRICES.starter : form.plan === "pro" ? PLAN_PRICES.pro : null;
                const amount = prices ? (b === "monthly" ? prices.monthly : prices.yearly) : form.amount;
                setForm((f) => ({ ...f, billing: b, amount }));
              }}
              style={{ ...inputStyle, width: "110px" }}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", color: "var(--ink-500)", fontWeight: 500 }}>Amount ($)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
              style={{ ...inputStyle, width: "90px" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", color: "var(--ink-500)", fontWeight: 500 }}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", color: "var(--ink-500)", fontWeight: 500 }}>Note (optional)</label>
            <input
              type="text"
              placeholder="Add note..."
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              style={{ ...inputStyle, width: "200px" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignSelf: "flex-end" }}>
            <button
              onClick={addRecord}
              style={{ padding: "7px 18px", fontSize: "13px", fontWeight: 600, borderRadius: "var(--r-md)", border: "none", background: "var(--genessa-blue)", color: "#fff", cursor: "pointer" }}
            >
              Save
            </button>
            {planSyncMsg && (
              <p style={{ fontSize: 11, color: planSyncMsg.startsWith("✅ Payment recorded &") ? "#10B981" : "#F59E0B", margin: 0, whiteSpace: "nowrap" }}>
                {planSyncMsg}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
