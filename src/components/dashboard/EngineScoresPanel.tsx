"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EngineScoreRow } from "@/app/api/dashboard/engine-scores/route";

const ENGINE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  claude:     { label: "Claude",     color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  gpt:        { label: "GPT-4o",     color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  perplexity: { label: "Perplexity", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
};

const LOCALES = ["en-US", "tr-TR"] as const;
type Locale = typeof LOCALES[number];

function pct(v: number | null): string {
  if (v === null || v === undefined) return "—";
  return `${Math.round(v * 100)}%`;
}

function SentimentBar({
  pos, neu, neg,
}: {
  pos: number | null; neu: number | null; neg: number | null;
}) {
  const p = pos ?? 0;
  const n = neu ?? 0;
  const g = neg ?? 0;
  const total = p + n + g;
  if (total === 0) return <div style={{ height: 6, borderRadius: 3, background: "#F3F4F6" }} />;
  return (
    <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", gap: 1 }}>
      <div style={{ flex: Math.round(p * 100), background: "#16A34A", minWidth: p > 0 ? 2 : 0 }} />
      <div style={{ flex: Math.round(n * 100), background: "#D1D5DB", minWidth: n > 0 ? 2 : 0 }} />
      <div style={{ flex: Math.round(g * 100), background: "#DC2626", minWidth: g > 0 ? 2 : 0 }} />
    </div>
  );
}

function EngineCard({ row }: { row: EngineScoreRow | undefined; engine: string }) {
  const meta = ENGINE_META[row?.engine ?? "claude"] ?? ENGINE_META["claude"];
  const cited = row ? Math.round((row.citation_rate ?? 0) * 100) : null;

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #E5E7EB",
      borderRadius: 14,
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 14,
      minWidth: 0,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 28, height: 28, borderRadius: 8,
          background: meta.bg, border: `1px solid ${meta.border}`,
          fontSize: 13,
        }}>
          {row?.engine === "claude" ? "✦" : row?.engine === "gpt" ? "⊕" : "◉"}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{meta.label}</span>
      </div>

      {/* Citation rate — big number */}
      <div>
        <div style={{
          fontSize: 40, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1,
          color: cited !== null ? meta.color : "#D1D5DB",
        }}>
          {cited !== null ? `${cited}%` : "—"}
        </div>
        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>Citation rate</div>
      </div>

      {/* Sub-metrics */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { label: "Share of voice", val: pct(row?.share_of_voice ?? null) },
          { label: "Source links",   val: pct(row?.source_attribution_rate ?? null) },
        ].map(({ label, val }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#6B7280" }}>{label}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, color: "#374151",
              fontFamily: "var(--font-geist-mono)",
            }}>
              {val}
            </span>
          </div>
        ))}
      </div>

      {/* Sentiment bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <SentimentBar
          pos={row?.sentiment_positive_pct ?? null}
          neu={row?.sentiment_neutral_pct ?? null}
          neg={row?.sentiment_negative_pct ?? null}
        />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: "#16A34A" }}>
            {row ? `+${pct(row.sentiment_positive_pct)}` : "—"}
          </span>
          <span style={{ fontSize: 10, color: "#D1D5DB" }}>
            {row ? `~${pct(row.sentiment_neutral_pct)}` : "—"}
          </span>
          <span style={{ fontSize: 10, color: "#DC2626" }}>
            {row ? `-${pct(row.sentiment_negative_pct)}` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function EngineScoresPanel() {
  const [loading, setLoading] = useState(true);
  const [hasOrg, setHasOrg] = useState(false);
  const [scores, setScores] = useState<EngineScoreRow[]>([]);
  const [locale, setLocale] = useState<Locale>("en-US");
  const [periodLabel, setPeriodLabel] = useState<string>("");
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/engine-scores")
      .then((r) => r.json())
      .then(({ organization_id, extra_query_credits, scores: rows }) => {
        setHasOrg(!!organization_id);
        setCredits(typeof extra_query_credits === "number" ? extra_query_credits : null);
        setScores(rows ?? []);
        if (rows?.length) {
          const first = rows[0];
          try {
            const start = new Date(first.period_start).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const end   = new Date(first.period_end).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            setPeriodLabel(`${start} – ${end}`);
          } catch { /* ignore */ }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const forLocale = scores.filter((s) => s.target_locale === locale);
  const byEngine = (engine: string) => forLocale.find((s) => s.engine === engine);
  const hasScores = scores.length > 0;
  const localeHasData = forLocale.length > 0;

  if (loading) return null; // don't flash during initial page load

  // User hasn't completed onboarding — silently skip this panel
  if (!hasOrg) return null;

  return (
    <section style={{
      background: "#fff",
      border: "1px solid #E5E7EB",
      borderRadius: 16,
      padding: "22px 24px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      marginBottom: 0,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>AI Engine Visibility</span>
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>
            {hasScores ? `Current period: ${periodLabel}` : "Awaiting first engine run"}
          </div>
        </div>

        {/* Locale tabs */}
        <div style={{ display: "flex", gap: 4, background: "#F3F4F6", padding: 3, borderRadius: 8 }}>
          {LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              style={{
                padding: "4px 10px", borderRadius: 6, border: "none",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
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
      </div>

      {/* Empty state */}
      {!hasScores && (
        <div style={{
          textAlign: "center", padding: "28px 16px",
          borderRadius: 12, background: "#F9FAFB", border: "1px dashed #E5E7EB",
        }}>
          {credits === 0 ? (
            <>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🚀</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>
                Buy an analysis tour to start monitoring
              </p>
              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, margin: "0 0 16px" }}>
                A tour runs your prompts through Claude, GPT, and Perplexity — 3× each — and shows you exactly where you appear (and don&apos;t).
              </p>
              <a
                href={`https://wa.me/905325788737?text=${encodeURIComponent("Hi! I'd like to purchase an AI visibility tour for my business.")}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 22px", borderRadius: 10,
                  background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  textDecoration: "none",
                  boxShadow: "0 0 18px rgba(41,82,227,0.25)",
                }}
              >
                Buy a tour — from $49 →
              </a>
              <div style={{ marginTop: 10, fontSize: 12, color: "#9CA3AF" }}>
                No subscription · credits added within 24h
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 28, marginBottom: 10 }}>⚡</div>
              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, margin: "0 0 12px" }}>
                Engine scores will appear here after the first worker run.
              </p>
              <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                Run: <code style={{ background: "#F3F4F6", padding: "1px 6px", borderRadius: 4, fontFamily: "var(--font-geist-mono)" }}>npm run worker:engine</code>
              </div>
            </>
          )}
        </div>
      )}

      {/* Engine cards */}
      {hasScores && (
        <>
          {!localeHasData && (
            <div style={{ textAlign: "center", padding: "20px 0", fontSize: 13, color: "#9CA3AF" }}>
              No data yet for {locale}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {(["claude", "gpt", "perplexity"] as const).map((engine) => (
              <EngineCard key={engine} engine={engine} row={byEngine(engine)} />
            ))}
          </div>

          {/* Legend */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16, marginTop: 14,
            padding: "10px 14px", background: "#F9FAFB", borderRadius: 8,
            fontSize: 11, color: "#6B7280",
          }}>
            <span style={{ fontWeight: 600, color: "#9CA3AF" }}>Legend:</span>
            <span><strong>Citation rate</strong> — % of queries where your brand was mentioned</span>
            <span>·</span>
            <span><strong>Share of voice</strong> — your mentions ÷ all brand mentions</span>
            <span>·</span>
            <span>Sentiment: <span style={{ color: "#16A34A" }}>+</span> / <span style={{ color: "#D1D5DB" }}>~</span> / <span style={{ color: "#DC2626" }}>-</span></span>
          </div>

          {/* Credits exhausted banner */}
          {credits === 0 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginTop: 4, padding: "10px 14px", borderRadius: 10,
              background: "#FFFBEB", border: "1px solid #FDE68A",
              gap: 12,
            }}>
              <span style={{ fontSize: 12, color: "#92400E" }}>
                Query credits used up — buy a new tour to run fresh engine queries.
              </span>
              <a
                href={`https://wa.me/905325788737?text=${encodeURIComponent("Hi! I'd like to buy more analysis tour credits.")}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "5px 12px",
                  borderRadius: 7, background: "#7C3AED", color: "#fff",
                  textDecoration: "none", whiteSpace: "nowrap",
                }}
              >
                Buy more →
              </a>
            </div>
          )}

          {/* History link */}
          <div style={{ marginTop: 10, textAlign: "right" }}>
            <Link
              href="/dashboard/visibility"
              style={{ fontSize: 11, color: "#2952E3", textDecoration: "none", fontWeight: 600 }}
            >
              View full history →
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
