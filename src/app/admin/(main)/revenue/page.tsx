"use client";

import { useEffect, useState } from "react";

type PlanDist = { free: number; premium: number; agency: number };

type PaymentRecord = {
  id: string;
  email: string;
  plan: "premium" | "agency";
  amount: number;
  date: string;
  note: string;
};

const PRICES = { premium: 19, agency: 149 };

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

export default function AdminRevenuePage() {
  const [planDist, setPlanDist] = useState<PlanDist>({ free: 0, premium: 0, agency: 0 });
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [form, setForm] = useState({
    email: "",
    plan: "premium" as "premium" | "agency",
    amount: PRICES.premium,
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

  function addRecord() {
    if (!form.email.trim()) return;
    const record: PaymentRecord = {
      id: Date.now().toString(),
      email: form.email.trim(),
      plan: form.plan,
      amount: Number(form.amount),
      date: form.date,
      note: form.note,
    };
    const updated = [record, ...records];
    setRecords(updated);
    saveRecords(updated);
    setForm({
      email: "",
      plan: "premium",
      amount: PRICES.premium,
      date: new Date().toISOString().slice(0, 10),
      note: "",
    });
  }

  function deleteRecord(id: string) {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    saveRecords(updated);
  }

  const premiumRevenue = planDist.premium * PRICES.premium;
  const agencyRevenue = planDist.agency * PRICES.agency;
  const totalRevenue = premiumRevenue + agencyRevenue;

  const kpiCards = [
    { label: "FREE USERS", value: String(planDist.free), hint: "$0/ay" },
    { label: "PREMIUM USERS", value: String(planDist.premium), hint: `$${premiumRevenue}/ay @ $${PRICES.premium}` },
    { label: "AGENCY USERS", value: String(planDist.agency), hint: `$${agencyRevenue}/ay @ $${PRICES.agency}` },
    { label: "TAHMİNİ GELİR", value: `$${totalRevenue}`, hint: "Toplam MRR/ay" },
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
        <h2 className="mb-3 text-[15px] font-semibold text-[var(--ink-800)]">Manuel Ödeme Kayıtları</h2>
        <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--ink-0)]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--ink-50)]">
                {["Email", "Plan", "Tutar", "Tarih", "Not", "Sil"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--ink-600)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-5 text-sm text-[var(--ink-400)]">
                    Henüz kayıt yok.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-2.5 text-[var(--ink-800)]">{r.email}</td>
                    <td className="px-4 py-2.5">
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: r.plan === "premium" ? "#EDE9FE" : "#FEF3C7",
                          color: r.plan === "premium" ? "#8B5CF6" : "#F59E0B",
                        }}
                      >
                        {r.plan === "premium" ? "Premium" : "Agency"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-[var(--ink-800)]">${r.amount}</td>
                    <td className="px-4 py-2.5 text-[var(--ink-600)]">{r.date}</td>
                    <td className="px-4 py-2.5 text-[var(--ink-500)]">{r.note || "—"}</td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => deleteRecord(r.id)}
                        style={{
                          padding: "3px 8px",
                          fontSize: "11px",
                          border: "1px solid #FCA5A5",
                          borderRadius: "var(--r-sm)",
                          background: "#FEF2F2",
                          color: "#EF4444",
                          cursor: "pointer",
                        }}
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Form */}
      <div>
        <h2 className="mb-3 text-[15px] font-semibold text-[var(--ink-800)]">Yeni Ödeme Ekle</h2>
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
                const p = e.target.value as "premium" | "agency";
                setForm((f) => ({ ...f, plan: p, amount: PRICES[p] }));
              }}
              style={{ ...inputStyle, width: "130px" }}
            >
              <option value="premium">Premium</option>
              <option value="agency">Agency</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", color: "var(--ink-500)", fontWeight: 500 }}>Tutar ($)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
              style={{ ...inputStyle, width: "90px" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", color: "var(--ink-500)", fontWeight: 500 }}>Tarih</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", color: "var(--ink-500)", fontWeight: 500 }}>Not (opsiyonel)</label>
            <input
              type="text"
              placeholder="Not ekle..."
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              style={{ ...inputStyle, width: "200px" }}
            />
          </div>

          <button
            onClick={addRecord}
            style={{
              padding: "7px 18px",
              fontSize: "13px",
              fontWeight: 600,
              borderRadius: "var(--r-md)",
              border: "none",
              background: "var(--genessa-blue)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
