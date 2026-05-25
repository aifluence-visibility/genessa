"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { generateReport } from "@/lib/generateReport";

const SECTORS_MAP: Record<string, string> = {
  restaurant: "Restaurant & Café",
  clinic: "Clinic & Wellness",
  saas: "SaaS & Tech",
  hotel: "Hotel & Hospitality",
  creator: "Creator & Personal Brand",
  legal: "Legal & Finance",
  ecommerce: "E-Commerce",
  other: "Other",
  hospitality: "Hospitality",
  education: "Education",
  realestate: "Real Estate",
  finance: "Finance",
  marketing: "Marketing Agency",
};

function scoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return "#9CA3AF";
  if (score <= 40) return "#DC2626";
  if (score <= 70) return "#D97706";
  return "#16A34A";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch { return "—"; }
}

interface ScanData {
  id: string;
  domain: string;
  readiness_score: number | null;
  authority_score: number | null;
  influence_score: number | null;
  insight: {
    hero_text: string | null;
    strongest_point: string | null;
    critical_gap: string | null;
    quick_win: string | null;
  } | null;
  checklist: Array<{ label: string; points: number }> | null;
  issues: Array<{ issue: string; status: string }> | null;
  created_at: string;
}

export default function EntityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const domain = decodeURIComponent(params.domain as string);

  const [scan, setScan] = useState<ScanData | null>(null);
  const [sector, setSector] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace("/auth/login"); return; }
      const uid = data.user.id;

      supabase.from("agency_domains")
        .select("sector")
        .eq("user_id", uid)
        .eq("domain", domain)
        .maybeSingle()
        .then(({ data: d }) => setSector((d?.sector as string) ?? null));

      supabase.from("scans")
        .select("id, domain, readiness_score, authority_score, influence_score, insight, checklist, issues, created_at")
        .eq("user_id", uid)
        .eq("domain", domain)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data: s }) => {
          setScan(s as ScanData | null);
          setLoading(false);
        });
    });
  }, [domain, router]);

  async function handleDownloadPDF() {
    if (!scan || generatingPDF) return;
    setGeneratingPDF(true);
    try {
      await generateReport({
        domain,
        readiness: scan.readiness_score ?? 0,
        authority: scan.authority_score ?? null,
        influence: scan.influence_score ?? null,
        insight: scan.insight,
        checklist: scan.checklist,
        sectorLabel: sector ? (SECTORS_MAP[sector] ?? sector) : null,
      });
    } finally {
      setGeneratingPDF(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #E5E7EB", borderTopColor: "#2952E3", animation: "spin 700ms linear infinite" }} />
      </div>
    );
  }

  const sectorLabel = sector ? (SECTORS_MAP[sector] ?? sector) : null;

  return (
    <div style={{ padding: "36px 40px 80px", color: "#111827", maxWidth: 820 }}>
      <Link
        href="/dashboard"
        style={{ fontSize: 12, color: "#9CA3AF", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 20 }}
      >
        ← Back to Dashboard
      </Link>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 4px", color: "#111827" }}>
          {domain}
        </h1>
        <div style={{ fontSize: 13, color: "#6B7280" }}>
          AI Visibility Report{sectorLabel && <> · {sectorLabel}</>}
        </div>
        {scan && (
          <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
            Last scanned: {formatDate(scan.created_at)}
          </div>
        )}
      </div>

      {!scan ? (
        <div style={{
          background: "#fff", border: "1px dashed #D1D5DB", borderRadius: 16,
          padding: "64px 32px", textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🔍</div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#374151", margin: "0 0 8px" }}>
            No scan data yet
          </h2>
          <p style={{ fontSize: 14, color: "#9CA3AF", margin: "0 0 20px" }}>
            Run a scan to generate a report.
          </p>
          <button
            onClick={() => router.push(`/score?domain=${encodeURIComponent(domain)}${sector ? `&sector=${sector}` : ""}`)}
            style={{
              padding: "10px 24px", fontSize: 13, fontWeight: 600, borderRadius: 10,
              border: "none", background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
              color: "#fff", cursor: "pointer", fontFamily: "var(--font-geist-sans)",
              boxShadow: "0 0 20px rgba(41,82,227,0.28)",
            }}
          >
            Run First Scan →
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* 3 score cards */}
          <div style={{ display: "flex", gap: 14 }}>
            {[
              { label: "AI Readiness", score: scan.readiness_score, sub: "Technical infrastructure" },
              { label: "AI Authority",  score: scan.authority_score,  sub: "Semantic authority" },
              { label: "AI Influence",  score: scan.influence_score,  sub: "AI mention tracking" },
            ].map(({ label, score, sub }) => (
              <div key={label} style={{
                flex: 1, padding: "22px 24px", background: "#fff",
                border: "1px solid #E5E7EB", borderRadius: 16,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 10 }}>
                  {label}
                </div>
                <div style={{
                  fontSize: 56, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1,
                  color: scoreColor(score), marginBottom: 10,
                  fontFamily: "var(--font-geist-sans)",
                }}>
                  {score != null ? score : "—"}
                </div>
                <div style={{ height: 4, borderRadius: 999, background: "#F3F4F6", overflow: "hidden", marginBottom: 10 }}>
                  {score != null && (
                    <div style={{
                      height: "100%", width: `${score}%`, borderRadius: 999,
                      background: scoreColor(score),
                    }} />
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* AI Insight */}
          {scan.insight && (
            <section style={{
              borderRadius: 16, padding: "24px 26px",
              background: "#fff", border: "1px solid #E5E7EB",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 16 }}>AI Insight</div>
              {scan.insight.hero_text && (
                <p style={{ fontSize: 15, fontWeight: 500, color: "#1F2937", lineHeight: 1.65, margin: "0 0 16px", paddingBottom: 16, borderBottom: "1px solid #F3F4F6" }}>
                  {scan.insight.hero_text}
                </p>
              )}
              {[
                { key: "strongest_point", label: "Strongest Point", color: "#16A34A", bg: "rgba(22,163,74,0.07)", border: "rgba(22,163,74,0.18)", icon: "✓" },
                { key: "critical_gap",    label: "Critical Gap",    color: "#DC2626", bg: "rgba(220,38,38,0.06)", border: "rgba(220,38,38,0.15)", icon: "✕" },
                { key: "quick_win",       label: "Quick Win",       color: "#2563EB", bg: "rgba(37,99,235,0.06)", border: "rgba(37,99,235,0.15)", icon: "⚡" },
              ].map(({ key, label, color, bg, border, icon }) => {
                const text = scan.insight![key as keyof typeof scan.insight] as string | null;
                if (!text) return null;
                return (
                  <div key={key} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: "1px solid #F9FAFB" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color, marginTop: 2 }}>
                      {icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
                      <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.65, margin: 0 }}>{text}</p>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* Technical Issues */}
          {scan.issues && scan.issues.length > 0 && (
            <section style={{
              borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden",
              background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}>
              <div style={{ padding: "14px 22px", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Technical Issues</div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Issue", "Status"].map((h) => (
                      <th key={h} style={{ padding: "10px 22px", textAlign: "left" as const, fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.08em", borderBottom: "1px solid #F3F4F6" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scan.issues.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F9FAFB" }}>
                      <td style={{ padding: "11px 22px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: row.status === "critical" ? "#DC2626" : row.status === "passing" ? "#D1D5DB" : "#16A34A" }} />
                          <span style={{ fontSize: 13, color: "#374151" }}>{row.issue}</span>
                        </div>
                      </td>
                      <td style={{ padding: "11px 22px" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                          textTransform: "uppercase" as const, letterSpacing: "0.06em",
                          background: row.status === "critical" ? "#FEF2F2" : row.status === "passing" ? "#F3F4F6" : "#F0FDF4",
                          color: row.status === "critical" ? "#DC2626" : row.status === "passing" ? "#6B7280" : "#16A34A",
                          border: `1px solid ${row.status === "critical" ? "#FECACA" : row.status === "passing" ? "#E5E7EB" : "#BBF7D0"}`,
                        }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => router.push(`/score?domain=${encodeURIComponent(domain)}${sector ? `&sector=${sector}` : ""}`)}
              style={{
                padding: "11px 22px", borderRadius: 10,
                background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
                color: "#fff", fontSize: 13, fontWeight: 600,
                border: "none", cursor: "pointer", fontFamily: "var(--font-geist-sans)",
                boxShadow: "0 0 16px rgba(41,82,227,0.25)",
              }}
            >
              🔄 Rescan
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              style={{
                padding: "11px 22px", borderRadius: 10,
                background: generatingPDF ? "#F3F4F6" : "#fff",
                color: generatingPDF ? "#9CA3AF" : "#374151",
                fontSize: 13, fontWeight: 600,
                border: "1px solid #E5E7EB",
                cursor: generatingPDF ? "wait" : "pointer",
                fontFamily: "var(--font-geist-sans)",
              }}
            >
              {generatingPDF ? "Generating…" : "📄 Download PDF Report"}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
