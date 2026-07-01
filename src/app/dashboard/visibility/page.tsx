"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { EngineScoreRow } from "@/app/api/dashboard/engine-scores/route";

// ── helpers ───────────────────────────────────────────────────────────────────

function pct(v: number | null, decimals = 0): string {
  if (v === null || v === undefined) return "—";
  return `${(v * 100).toFixed(decimals)}%`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch { return iso; }
}

function scoreColor(v: number | null): string {
  if (v === null) return "#9CA3AF";
  if (v >= 0.6) return "#16A34A";
  if (v >= 0.3) return "#D97706";
  return "#DC2626";
}

const ENGINE_META: Record<string, { label: string; color: string }> = {
  claude:     { label: "Claude",     color: "#D97706" },
  gpt:        { label: "GPT-4o",     color: "#16A34A" },
  perplexity: { label: "Perplexity", color: "#7C3AED" },
};

const ENGINES = ["claude", "gpt", "perplexity"] as const;
const LOCALES = ["en-US", "tr-TR"] as const;
type Locale = typeof LOCALES[number];

// ── sparkline (inline SVG) ────────────────────────────────────────────────────

function Sparkline({ values, color }: { values: (number | null)[]; color: string }) {
  const pts = values.filter((v): v is number => v !== null);
  if (pts.length < 2) return <span style={{ fontSize: 10, color: "#D1D5DB" }}>—</span>;

  const W = 72, H = 24;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const coords = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
    </svg>
  );
}

// ── trend summary per engine×locale ──────────────────────────────────────────

function TrendRow({
  engine, locale, rows,
}: {
  engine: string;
  locale: string;
  rows: EngineScoreRow[];
}) {
  const meta = ENGINE_META[engine] ?? { label: engine, color: "#6B7280" };
  // rows are newest-first → reverse for chart left→right
  const ordered = [...rows].reverse();
  const citations = ordered.map((r) => r.citation_rate);
  const sovs = ordered.map((r) => r.share_of_voice);

  const latest = rows[0]; // newest first
  if (!latest) return null;

  return (
    <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
      <td style={{ padding: "12px 16px", width: 110 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 12, fontWeight: 700, color: meta.color,
        }}>
          {meta.label}
        </span>
      </td>
      <td style={{ padding: "12px 16px", textAlign: "center" }}>
        <span style={{
          fontSize: 15, fontWeight: 700, color: scoreColor(latest.citation_rate),
          fontFamily: "var(--font-geist-mono)",
        }}>
          {pct(latest.citation_rate)}
        </span>
      </td>
      <td style={{ padding: "12px 16px", textAlign: "center", fontFamily: "var(--font-geist-mono)", fontSize: 13, color: "#374151" }}>
        {pct(latest.share_of_voice)}
      </td>
      <td style={{ padding: "12px 16px", textAlign: "center", fontFamily: "var(--font-geist-mono)", fontSize: 13, color: "#374151" }}>
        {pct(latest.source_attribution_rate)}
      </td>
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: "#16A34A", fontFamily: "var(--font-geist-mono)" }}>
            +{pct(latest.sentiment_positive_pct, 0)}
          </span>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: "#F3F4F6", overflow: "hidden", display: "flex" }}>
            <div style={{ width: pct(latest.sentiment_positive_pct ?? 0), background: "#16A34A", minWidth: 0 }} />
            <div style={{ width: pct(latest.sentiment_neutral_pct ?? 0), background: "#D1D5DB", minWidth: 0 }} />
            <div style={{ width: pct(latest.sentiment_negative_pct ?? 0), background: "#DC2626", minWidth: 0 }} />
          </div>
          <span style={{ fontSize: 10, color: "#DC2626", fontFamily: "var(--font-geist-mono)" }}>
            -{pct(latest.sentiment_negative_pct, 0)}
          </span>
        </div>
      </td>
      <td style={{ padding: "12px 16px" }}>
        <Sparkline values={citations} color={meta.color} />
      </td>
      <td style={{ padding: "12px 16px" }}>
        <Sparkline values={sovs} color="#6B7280" />
      </td>
    </tr>
  );
}

// ── period history table ──────────────────────────────────────────────────────

function PeriodTable({
  locale, rows,
}: {
  locale: Locale;
  rows: EngineScoreRow[];
}) {
  const forLocale = rows.filter((r) => r.target_locale === locale);

  // Unique periods, newest first
  const periods = [...new Set(forLocale.map((r) => r.period_start))].sort().reverse();

  if (periods.length === 0) {
    return (
      <div style={{
        textAlign: "center", padding: "32px 16px",
        borderRadius: 12, background: "#F9FAFB", border: "1px dashed #E5E7EB",
      }}>
        <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>No data for {locale} yet.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
        <thead>
          <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #E5E7EB" }}>
            {["Week of", "Engine", "Citation rate", "Share of voice", "Source links", "Sentiment"].map((h) => (
              <th key={h} style={{
                padding: "9px 16px", textAlign: "left",
                fontSize: 10, fontWeight: 700, color: "#9CA3AF",
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) =>
            ENGINES.map((engine, ei) => {
              const row = forLocale.find((r) => r.period_start === period && r.engine === engine);
              const meta = ENGINE_META[engine];
              return (
                <tr
                  key={`${period}-${engine}`}
                  style={{
                    borderBottom: "1px solid #F9FAFB",
                    background: ei === 0 ? "#FAFAFA" : "#fff",
                  }}
                >
                  {ei === 0 && (
                    <td
                      rowSpan={3}
                      style={{
                        padding: "12px 16px", verticalAlign: "middle",
                        fontSize: 12, color: "#374151", fontFamily: "var(--font-geist-mono)",
                        borderRight: "1px solid #F3F4F6",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmtDate(period)}
                    </td>
                  )}
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                  </td>
                  <td style={{
                    padding: "10px 16px", textAlign: "center",
                    fontFamily: "var(--font-geist-mono)", fontSize: 13,
                    fontWeight: 700, color: scoreColor(row?.citation_rate ?? null),
                  }}>
                    {pct(row?.citation_rate ?? null)}
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "center", fontFamily: "var(--font-geist-mono)", fontSize: 12, color: "#374151" }}>
                    {pct(row?.share_of_voice ?? null)}
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "center", fontFamily: "var(--font-geist-mono)", fontSize: 12, color: "#374151" }}>
                    {pct(row?.source_attribution_rate ?? null)}
                  </td>
                  <td style={{ padding: "10px 16px", minWidth: 140 }}>
                    {row ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 10, color: "#16A34A" }}>+{pct(row.sentiment_positive_pct, 0)}</span>
                        <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#F3F4F6", overflow: "hidden", display: "flex" }}>
                          <div style={{ width: pct(row.sentiment_positive_pct ?? 0), background: "#16A34A" }} />
                          <div style={{ width: pct(row.sentiment_neutral_pct ?? 0), background: "#D1D5DB" }} />
                          <div style={{ width: pct(row.sentiment_negative_pct ?? 0), background: "#DC2626" }} />
                        </div>
                        <span style={{ fontSize: 10, color: "#DC2626" }}>-{pct(row.sentiment_negative_pct, 0)}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: "#D1D5DB" }}>no data</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function VisibilityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasOrg, setHasOrg] = useState(false);
  const [allRows, setAllRows] = useState<EngineScoreRow[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [locale, setLocale] = useState<Locale>("en-US");

  useEffect(() => {
    fetch("/api/dashboard/engine-scores?history=true")
      .then((r) => r.json())
      .then(({ organization_id, extra_query_credits, scores }) => {
        if (!organization_id) {
          router.replace("/onboarding");
          return;
        }
        setHasOrg(true);
        setCredits(typeof extra_query_credits === "number" ? extra_query_credits : null);
        setAllRows(scores ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const forLocale = allRows.filter((r) => r.target_locale === locale);
  const trendRows = ENGINES.map((engine) => ({
    engine,
    rows: forLocale.filter((r) => r.engine === engine),
  })).filter((e) => e.rows.length > 0);

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #E5E7EB", borderTopColor: "#2952E3", animation: "spin 700ms linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "36px 40px 80px", color: "#111827" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#2952E3", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, opacity: 0.7 }}>
            AI Engine Monitoring
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 4px" }}>
            Visibility History
          </h1>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
            Full engine × locale breakdown across all analysis periods
          </p>
        </div>
        <Link
          href="/dashboard"
          style={{ fontSize: 12, color: "#6B7280", textDecoration: "none", padding: "8px 16px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff" }}
        >
          ← Dashboard
        </Link>
      </div>

      {/* Credits chip */}
      {credits !== null && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 14px", borderRadius: 20, marginBottom: 20,
          background: credits > 0 ? "#F0FDF4" : "#FFFBEB",
          border: `1px solid ${credits > 0 ? "#BBF7D0" : "#FDE68A"}`,
          fontSize: 12, fontWeight: 600,
          color: credits > 0 ? "#15803D" : "#92400E",
        }}>
          <span>{credits > 0 ? "⚡" : "⚠️"}</span>
          {credits > 0
            ? `${credits} analysis tour credit${credits !== 1 ? "s" : ""} remaining`
            : "No credits remaining"}
          {credits === 0 && (
            <a
              href={`https://wa.me/905325788737?text=${encodeURIComponent("Hi! I'd like to buy more analysis tour credits.")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginLeft: 4, fontSize: 11, fontWeight: 700,
                color: "#7C3AED", textDecoration: "none",
              }}
            >
              Buy more →
            </a>
          )}
        </div>
      )}

      {/* Locale tabs */}
      <div style={{ display: "flex", gap: 4, background: "#F3F4F6", padding: 3, borderRadius: 8, marginBottom: 24, width: "fit-content" }}>
        {LOCALES.map((l) => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            style={{
              padding: "6px 14px", borderRadius: 6, border: "none",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: locale === l ? "#fff" : "transparent",
              color: locale === l ? "#111827" : "#9CA3AF",
              boxShadow: locale === l ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              fontFamily: "var(--font-geist-mono)",
              transition: "all 120ms",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {allRows.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 32px",
          background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB",
        }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>📊</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>No engine scores yet</p>
          <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, margin: "0 0 20px" }}>
            {credits === 0
              ? "Purchase an analysis tour — credits are added within 24h and the worker will run automatically."
              : "Run the engine worker to start generating visibility scores."}
          </p>
          {credits === 0 ? (
            <a
              href={`https://wa.me/905325788737?text=${encodeURIComponent("Hi! I'd like to purchase an AI visibility tour.")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 22px", borderRadius: 10,
                background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
                color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none",
              }}
            >
              Buy a tour — from $49 →
            </a>
          ) : (
            <code style={{ background: "#F3F4F6", padding: "4px 10px", borderRadius: 6, fontSize: 12 }}>
              npm run worker:engine
            </code>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Trend summary */}
          {trendRows.length > 0 && (
            <section style={{
              background: "#fff", borderRadius: 16,
              border: "1px solid #E5E7EB", overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Latest period — trend</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                    {["Engine", "Citation rate", "Share of voice", "Source links", "Sentiment", "Citation trend", "SoV trend"].map((h) => (
                      <th key={h} style={{
                        padding: "8px 16px", textAlign: "left",
                        fontSize: 10, fontWeight: 700, color: "#9CA3AF",
                        textTransform: "uppercase", letterSpacing: "0.08em",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trendRows.map(({ engine, rows }) => (
                    <TrendRow key={engine} engine={engine} locale={locale} rows={rows} />
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Full period history */}
          <section style={{
            background: "#fff", borderRadius: 16,
            border: "1px solid #E5E7EB", overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>All periods</span>
              <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 8 }}>
                {[...new Set(forLocale.map((r) => r.period_start))].length} period{[...new Set(forLocale.map((r) => r.period_start))].length !== 1 ? "s" : ""}
              </span>
            </div>
            <PeriodTable locale={locale} rows={allRows} />
          </section>

        </div>
      )}
    </div>
  );
}
