"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalizePlan, type Plan } from "@/lib/plan";
import PlanGate from "@/components/dashboard/PlanGate";

type ScanRecord = {
  id: string;
  domain: string;
  readiness_score: number | null;
  created_at: string;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ScanHistoryPage() {
  const [plan, setPlan] = useState<Plan>("free");
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      Promise.all([
        supabase.from("profiles").select("plan").eq("id", data.user.id).maybeSingle(),
        supabase.from("scans").select("id, domain, readiness_score, created_at")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false }),
      ]).then(([profileRes, scansRes]) => {
        setPlan(normalizePlan(profileRes.data?.plan as string));
        setScans((scansRes.data ?? []) as ScanRecord[]);
        setReady(true);
      });
    });
  }, []);

  if (!ready) return null;

  return (
    <div style={{ padding: "36px 40px 80px", color: "#111827" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 6px" }}>
          📋 Scan History
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
          Your full scan history across all domains.
        </p>
      </div>
      <PlanGate
        requiredPlan="starter"
        currentPlan={plan}
        featureName="Scan History"
        featureDescription="View your complete scan history, track score changes over time, and compare domains. Available on Starter and above."
      >
        {scans.length === 0 ? (
          <div style={{
            padding: "48px 32px", borderRadius: 16,
            background: "#fff", border: "1px solid #E5E7EB",
            textAlign: "center",
          }}>
            <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>No scans yet. Run a scan from the Dashboard.</p>
          </div>
        ) : (
          <div style={{
            borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden",
            background: "#fff",
          }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                {scans.length} scan{scans.length !== 1 ? "s" : ""}
              </div>
            </div>
            {scans.map((scan, i) => (
              <div key={scan.id} style={{
                display: "flex", alignItems: "center",
                padding: "12px 24px",
                borderBottom: i < scans.length - 1 ? "1px solid #F9FAFB" : "none",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {scan.domain}
                  </div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{fmtDate(scan.created_at)}</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#2952E3", letterSpacing: "-0.03em", margin: "0 20px", fontFamily: "var(--font-geist-sans)" }}>
                  {scan.readiness_score ?? "—"}
                </div>
                <button
                  onClick={() => router.push(`/score?domain=${encodeURIComponent(scan.domain)}`)}
                  style={{
                    fontSize: 12, fontWeight: 600, color: "#2952E3",
                    background: "rgba(41,82,227,0.06)", border: "1px solid rgba(41,82,227,0.15)",
                    borderRadius: 8, padding: "6px 14px", cursor: "pointer",
                    fontFamily: "var(--font-geist-sans)", whiteSpace: "nowrap",
                  }}
                >
                  View →
                </button>
              </div>
            ))}
          </div>
        )}
      </PlanGate>
    </div>
  );
}
