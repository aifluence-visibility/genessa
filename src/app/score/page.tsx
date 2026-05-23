"use client";

import { useState, useEffect, Suspense, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ScoreRing } from "@/components/ScoreRing";
import { StatusPill } from "@/components/StatusPill";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface CheckResult {
  name: string;
  status: "pass" | "partial" | "fail";
  points: number;
  weight: number;
  impact: string;
  action: string;
  details?: string;
}

interface AuditResult {
  url: string;
  score: number;
  checks: CheckResult[];
}

interface InsightResult {
  hero_text: string | null;
  strongest_point: string | null;
  critical_gap: string | null;
  quick_win: string | null;
}

function ScorePageContent() {
  const searchParams = useSearchParams();
  const rawUrl = (searchParams.get("url") || "acme.com").replace(/^https?:\/\//, "").replace(/\/$/, "");
  return <ScoreAuditView key={rawUrl} rawUrl={rawUrl} />;
}

function ScoreAuditView({ rawUrl }: { rawUrl: string }) {
  const router = useRouter();
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<InsightResult | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/audit?url=${encodeURIComponent(rawUrl)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setResult(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    fetch(`/api/insight?url=${encodeURIComponent(rawUrl)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setInsight(data);
          setInsightLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setInsightLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rawUrl]);

  async function handleGetFullReport() {
    const scanData = {
      domain: rawUrl,
      readiness: result?.score ?? null,
      authority: null,
      influence: null,
      insight: insight ?? null,
    };
    localStorage.setItem("pendingScan", JSON.stringify(scanData));

    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/auth/login?next=/dashboard");
    } else {
      router.push("/dashboard");
    }
  }

  async function handleEmailSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailSubmitting(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, domain: rawUrl, score: result?.score ?? 0 }),
      });
    } catch { /* silent fail */ }
    setEmailSubmitting(false);
    setEmailSubmitted(true);
  }

  const score = result?.score ?? 0;
  const verdict = score >= 90 ? "excellent" : score >= 80 ? "good" : score >= 60 ? "mid" : "poor";

  const fixes = (result?.checks ?? [])
    .filter((c) => c.status !== "pass")
    .map((c) => ({ title: c.action, body: c.impact, gain: c.weight - c.points }))
    .filter((f) => f.gain > 0);
  const totalGain = fixes.reduce((s, f) => s + f.gain, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--fg)]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-3 flex items-center gap-3 md:gap-4">
          <Link href="/" className="flex items-center gap-2 md:gap-2.5 no-underline text-[var(--fg)] font-semibold text-lg tracking-[-0.02em] shrink-0">
            <Logo size={26} label={false} />
            <span className="hidden sm:inline">Genessa</span>
          </Link>
          <div className="hidden sm:block h-5 w-px bg-[var(--border)] ml-2" />
          <div className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg min-w-0"
            style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, color: "var(--fg-2)" }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: loading ? "var(--score-mid)" : "var(--score-good)" }} />
            <span className="truncate">{rawUrl}</span>
          </div>
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <button onClick={() => window.location.reload()} className="text-[13px] font-medium px-3 py-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] text-[var(--fg)] cursor-pointer"
              style={{ fontFamily: "var(--font-geist-sans)" }}>Re-scan</button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1080px] mx-auto px-4 md:px-6 py-6 md:py-8 pb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 md:py-32">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="24" stroke="var(--border)" strokeWidth="4" fill="none" />
              <circle cx="32" cy="32" r="24" stroke="url(#scang)" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="38 150"
                style={{ animation: "spin 900ms linear infinite", transformOrigin: "center" }} />
              <defs><linearGradient id="scang" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#2952E3" /><stop offset="1" stopColor="#7B3FE4" /></linearGradient></defs>
            </svg>
            <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, color: "var(--fg-2)" }}>Scanning {rawUrl}…</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : result ? (
          <>
            {/* Score Hero */}
            <div className="flex flex-col md:grid md:grid-cols-[200px_1fr] lg:grid-cols-[240px_1fr] items-center gap-6 md:gap-10 py-4 md:py-6 pb-8 md:pb-10">
              <div className="shrink-0">
                <ScoreRing value={score} size={160} />
              </div>
              <div className="text-center md:text-left">
                <div className="eyebrow mb-2 md:mb-3">AI Visibility Score</div>
                <h1 className="text-2xl md:text-[40px] font-semibold tracking-[-0.03em] leading-tight mb-3">
                  {rawUrl} is <span className="gradient-text">{verdict}</span> with AI.
                </h1>
                <p className="text-sm md:text-base text-[var(--fg-2)] leading-relaxed mb-5 md:mb-6 max-w-[540px] mx-auto md:mx-0">
                  Genessa tested {rawUrl} against 9 checks. {result.checks.filter(c => c.status === "pass").length} passed — {result.checks.filter(c => c.status !== "pass").length} need attention.
                </p>
                <div className="flex gap-2.5 flex-wrap justify-center md:justify-start">
                  <Link href={`/badge?url=${encodeURIComponent(rawUrl)}&score=${score}`} className="no-underline text-sm font-medium px-4 py-2.5 rounded-[10px] text-white whitespace-nowrap"
                    style={{ background: "var(--genessa-gradient)", boxShadow: "var(--shadow-sm)" }}>Get free badge</Link>
                  {emailSubmitted ? (
                    <span className="text-sm text-[var(--fg-2)] px-1 py-2.5">✓ We&apos;ll be in touch</span>
                  ) : showEmailForm ? (
                    <form onSubmit={handleEmailSubmit} className="flex items-center gap-2">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="you@company.com"
                        required
                        autoFocus
                        className="text-sm px-3 py-2 rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg)] text-[var(--fg)] outline-none min-w-[180px]"
                        style={{ fontFamily: "var(--font-geist-sans)" }}
                      />
                      <button type="submit" disabled={emailSubmitting}
                        className="text-sm font-medium px-4 py-2.5 rounded-[10px] text-white whitespace-nowrap"
                        style={{ background: "var(--genessa-gradient)", fontFamily: "var(--font-geist-sans)", opacity: emailSubmitting ? 0.7 : 1, cursor: emailSubmitting ? "default" : "pointer" }}>
                        {emailSubmitting ? "…" : "Send →"}
                      </button>
                    </form>
                  ) : (
                    <button onClick={handleGetFullReport}
                      className="text-sm font-medium px-4 py-2.5 rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg)] text-[var(--fg)] cursor-pointer"
                      style={{ fontFamily: "var(--font-geist-sans)" }}>Get full report →</button>
                  )}
                </div>
              </div>
            </div>

            {/* 3 Score Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-5 md:mb-6">
              {/* AI Readiness */}
              <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg)] p-4 md:p-5 shadow-[var(--shadow-sm)]">
                <div className="eyebrow mb-3">AI Readiness</div>
                <div className="flex items-end gap-1.5">
                  <span className="text-[40px] font-semibold tracking-[-0.04em] gradient-text leading-none">{score}</span>
                  <span className="text-base text-[var(--fg-3)] mb-1">/100</span>
                </div>
                <div className="text-[13px] text-[var(--fg-2)] mt-2">Technical AI readiness</div>
              </div>

              {/* AI Authority — coming soon */}
              <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-subtle)] p-4 md:p-5">
                <div className="eyebrow mb-3" style={{ opacity: 0.5 }}>AI Authority</div>
                <div className="mb-1.5">
                  <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-[var(--bg-muted)] text-[var(--fg-3)]" style={{ fontFamily: "var(--font-geist-mono)" }}>Coming soon</span>
                </div>
                <div className="text-[13px] text-[var(--fg-3)] mt-2">Semantic authority signals</div>
              </div>

              {/* AI Influence — premium locked */}
              <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-subtle)] p-4 md:p-5">
                <div className="eyebrow mb-3" style={{ opacity: 0.5 }}>AI Influence</div>
                <div className="flex items-center gap-2 mb-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--fg-3)]">Premium</span>
                </div>
                <div className="text-[13px] text-[var(--fg-3)] mt-2">AI mention tracking</div>
              </div>
            </div>

            {/* Fix Now Alert */}
            {fixes.length > 0 && (
              <div className="flex flex-col gap-3 p-4 md:p-5 rounded-[14px] border border-[#FCA5A5]"
                style={{ background: "linear-gradient(180deg, rgba(239,68,68,0.04), rgba(239,68,68,0.02))" }}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span className="text-[15px] font-semibold text-[#991B1B]">Fix now — earn +{totalGain} points</span>
                  </div>
                  <span className="text-xs text-[#991B1B] px-2.5 py-0.5 rounded-full bg-[rgba(220,38,38,0.1)]" style={{ fontFamily: "var(--font-geist-mono)" }}>{fixes.length} critical</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {fixes.map((f) => (
                    <div key={f.title} className="flex flex-col sm:flex-row items-start gap-3 p-3 md:p-3.5 rounded-[10px] border border-[var(--border)] bg-[var(--bg)]">
                      <span className="shrink-0 px-2.5 py-1 rounded-md bg-[var(--score-good-bg)] text-[var(--score-good)] text-[11px] font-semibold" style={{ fontFamily: "var(--font-geist-mono)" }}>+{f.gain} pts</span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold mb-0.5">{f.title}</div>
                        <div className="text-[13px] text-[var(--fg-2)] leading-relaxed">{f.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Breakdown Table + Insight Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 mt-5">
              {/* Score breakdown */}
              <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-[var(--shadow-sm)]">
                <div className="flex items-center justify-between px-4 md:px-5 py-3.5 md:py-4 border-b border-[var(--border)]">
                  <div className="text-base font-semibold tracking-[-0.01em]">Score breakdown</div>
                  <div className="eyebrow text-[11px]">9 checks · weighted</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: 400 }}>
                    <thead>
                      <tr className="bg-[var(--bg-subtle)]">
                        <th style={thStyle}>Check</th>
                        <th style={thStyle}>Status</th>
                        <th style={{ ...thStyle, textAlign: "right", paddingRight: 20 }}>Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.checks.map((r) => (
                        <tr key={r.name} className="border-t border-[var(--border)]">
                          <td style={tdStyle}>
                            <div className="text-[13.5px] text-[var(--fg)]" style={{ fontFamily: "var(--font-geist-mono)" }}>{r.name}</div>
                            <div className="text-[13px] text-[var(--fg-2)] mt-0.5">{r.impact}</div>
                          </td>
                          <td style={tdStyle}>
                            <StatusPill kind={r.status} label={r.status === "pass" ? "Pass" : r.status === "partial" ? "Partial" : "Missing"} />
                          </td>
                          <td className="text-right font-medium" style={{ ...tdStyle, paddingRight: 20, fontFamily: "var(--font-geist-mono)" }}>{r.weight}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Insight Panel */}
              {insightLoading ? (
                <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg)] shadow-[var(--shadow-sm)] overflow-hidden">
                  <div className="px-4 md:px-5 py-3.5 md:py-4 border-b border-[var(--border)]">
                    <div className="h-3 w-20 rounded bg-[var(--bg-muted)] animate-pulse" />
                  </div>
                  <div className="p-4 md:p-5 flex flex-col gap-3.5">
                    <div className="h-5 w-full rounded-md bg-[var(--bg-muted)] animate-pulse" />
                    <div className="h-5 w-4/5 rounded-md bg-[var(--bg-muted)] animate-pulse mb-2" />
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="p-3.5 rounded-[10px] border border-[var(--border)] flex flex-col gap-2">
                        <div className="h-2.5 w-24 rounded bg-[var(--bg-muted)] animate-pulse" />
                        <div className="h-4 w-full rounded bg-[var(--bg-muted)] animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : insight ? (
                <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-[var(--shadow-sm)]">
                  <div className="px-4 md:px-5 py-3.5 md:py-4 border-b border-[var(--border)]">
                    <div className="eyebrow text-[11px]">AI Insight</div>
                  </div>
                  <div className="p-4 md:p-5 flex flex-col gap-3">
                    {insight.hero_text && (
                      <p className="text-[15px] font-medium leading-relaxed text-[var(--fg)] tracking-[-0.01em] pb-1">
                        {insight.hero_text}
                      </p>
                    )}
                    {insight.strongest_point && (
                      <div className="flex flex-col gap-1.5 p-3.5 rounded-[10px] border border-[#86EFAC]" style={{ background: "rgba(34,197,94,0.04)" }}>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#16A34A]">Strongest point</div>
                        <div className="text-[13px] text-[var(--fg)] leading-relaxed">{insight.strongest_point}</div>
                      </div>
                    )}
                    {insight.critical_gap && (
                      <div className="flex flex-col gap-1.5 p-3.5 rounded-[10px] border border-[#FCA5A5]" style={{ background: "rgba(239,68,68,0.04)" }}>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#DC2626]">Critical gap</div>
                        <div className="text-[13px] text-[var(--fg)] leading-relaxed">{insight.critical_gap}</div>
                      </div>
                    )}
                    {insight.quick_win && (
                      <div className="flex flex-col gap-1.5 p-3.5 rounded-[10px] border border-[#93C5FD]" style={{ background: "rgba(59,130,246,0.04)" }}>
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[#2563EB]">Quick win</div>
                        <div className="text-[13px] text-[var(--fg)] leading-relaxed">{insight.quick_win}</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center rounded-[14px] border border-[var(--border)] bg-[var(--bg)] p-8 md:p-10 shadow-[var(--shadow-sm)]">
                  <div className="text-lg md:text-xl font-semibold tracking-[-0.02em] mb-2">Want to see where AI mentions you?</div>
                  <p className="text-sm text-[var(--fg-2)] leading-relaxed max-w-[400px] mb-5">Our detailed report tracks your brand across ChatGPT, Perplexity, Claude and Google AI Overviews.</p>
                  <Link href="/pricing" className="no-underline text-sm font-medium px-5 py-2.5 rounded-[10px] text-white"
                    style={{ background: "var(--genessa-gradient)", boxShadow: "var(--shadow-sm)" }}>Get detailed report →</Link>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-[var(--fg-2)]">Failed to load audit. Try again.</div>
        )}
      </main>
    </div>
  );
}

const thStyle: React.CSSProperties = { textAlign: "left", padding: "10px 16px", fontSize: 11, fontFamily: "var(--font-geist-mono)", fontWeight: 500, color: "var(--fg-3)", letterSpacing: "0.06em", textTransform: "uppercase" };
const tdStyle: React.CSSProperties = { padding: "14px 16px", verticalAlign: "middle" };

export default function ScorePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-[var(--fg-2)]">Loading…</div>}>
      <ScorePageContent />
    </Suspense>
  );
}
