"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface PendingScan {
  domain: string;
  readiness: number | null;
  authority: number | null;
  influence: number | null;
  insight: {
    hero_text: string | null;
    strongest_point: string | null;
    critical_gap: string | null;
    quick_win: string | null;
  } | null;
}

// ─── Animated counter ──────────────────────────────────────────────────────────
function useCounter(target: number | null, duration = 1400) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === null || target === 0) { setCount(0); return; }
    let startTime: number | null = null;
    let rafId: number;
    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return count;
}

// ─── Circular score ring ───────────────────────────────────────────────────────
function ScoreRing({
  value, label, sublabel, size = 130, stroke = 9,
}: {
  value: number | null; label: string; sublabel?: string; size?: number; stroke?: number;
}) {
  const displayed = useCounter(value);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = value !== null ? circ * (1 - value / 100) : circ;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2952E3" />
              <stop offset="100%" stopColor="#7B3FE4" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={value !== null ? "url(#ringGrad)" : "rgba(255,255,255,0.06)"}
            strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.32, 0, 0.67, 0)" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1 }}>
            {value !== null ? displayed : "—"}
          </span>
          {value !== null && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>/100</span>
          )}
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{sublabel}</div>}
      </div>
    </div>
  );
}

// ─── Checklist item ────────────────────────────────────────────────────────────
function ChecklistItem({ done, label, points }: { done: boolean; label: string; points: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
        border: done ? "none" : "1.5px solid rgba(255,255,255,0.18)",
        background: done ? "#22C55E" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {done && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span style={{ flex: 1, fontSize: 14, color: done ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.78)", textDecoration: done ? "line-through" : "none" }}>
        {label}
      </span>
      {!done && (
        <span style={{ fontSize: 12, fontWeight: 600, color: "#5B8EF0", whiteSpace: "nowrap", fontFamily: "var(--font-geist-mono)" }}>
          +{points} pts
        </span>
      )}
      {done && <span style={{ fontSize: 12, color: "#22C55E", fontWeight: 600 }}>✓</span>}
    </div>
  );
}

// ─── Insight card ──────────────────────────────────────────────────────────────
function InsightCard({ icon, label, text, borderColor, bgColor, labelColor }: {
  icon: ReactNode; label: string; text: string;
  borderColor: string; bgColor: string; labelColor: string;
}) {
  return (
    <div style={{ padding: "13px 15px", borderRadius: 12, border: `1px solid ${borderColor}`, background: bgColor }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
        {icon}
        <span style={{ fontSize: 10, fontWeight: 700, color: labelColor, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: 0 }}>{text}</p>
    </div>
  );
}

// ─── Main dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingScan, setPendingScan] = useState<PendingScan | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/auth/login");
      } else {
        setUser(data.user);
        setLoading(false);
      }
    });
  }, [router]);

  useEffect(() => {
    const raw = localStorage.getItem("pendingScan");
    if (raw) {
      try { setPendingScan(JSON.parse(raw)); } catch { /* ignore */ }
      localStorage.removeItem("pendingScan");
    }
  }, []);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#070A11" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.07)", borderTopColor: "#2952E3" }}
            className="animate-spin" />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}.animate-spin{animation:spin 700ms linear infinite}`}</style>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>Loading…</span>
        </div>
      </div>
    );
  }

  const hasScan = pendingScan !== null;
  const BG = "#070A11";
  const CARD = "rgba(255,255,255,0.026)";
  const BORDER = "rgba(255,255,255,0.08)";
  const BORDER_STRONG = "rgba(255,255,255,0.13)";

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#fff" }}>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes glow-pulse { 0%,100%{box-shadow:0 0 5px #2952E3;} 50%{box-shadow:0 0 12px #2952E3;} }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        borderBottom: `1px solid ${BORDER}`,
        padding: "0 28px", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(7,10,17,0.88)",
        backdropFilter: "blur(14px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{
              fontSize: 16, fontWeight: 700, letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
              WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
            }}>
              Genessa
            </span>
          </Link>

          {/* Agent status pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "4px 11px", borderRadius: 999,
            background: "rgba(41,82,227,0.1)",
            border: "1px solid rgba(41,82,227,0.22)",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#2952E3",
              animation: "glow-pulse 2.4s ease infinite",
            }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(120,155,255,0.85)", letterSpacing: "0.07em" }}>
              GENERAL AGENT
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>{user?.email}</span>
          <button
            onClick={handleSignOut}
            style={{
              fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.38)",
              background: "none", border: `1px solid ${BORDER_STRONG}`,
              borderRadius: 7, padding: "5px 12px", cursor: "pointer",
              fontFamily: "var(--font-geist-sans)",
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 36, flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(41,82,227,0.65)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              AI Visibility Control Center
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.04em", margin: 0, color: "#fff" }}>
              Your AI Operations
            </h1>
          </div>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "11px 22px", borderRadius: 11,
            background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
            color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none",
            boxShadow: "0 0 28px rgba(41,82,227,0.38)",
          }}>
            + Run a scan
          </Link>
        </div>

        {!hasScan ? (
          /* ── Empty state ── */
          <div style={{
            border: `1px dashed ${BORDER_STRONG}`, borderRadius: 22,
            padding: "90px 32px", textAlign: "center",
            background: "linear-gradient(180deg, rgba(41,82,227,0.05) 0%, transparent 100%)",
          }}>
            <div style={{
              width: 68, height: 68, borderRadius: "50%", margin: "0 auto 26px",
              background: "linear-gradient(135deg, rgba(41,82,227,0.18), rgba(123,63,228,0.18))",
              border: "1px solid rgba(41,82,227,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(100,140,255,0.75)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 12px", color: "#fff" }}>
              No scans yet
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.38)", lineHeight: 1.7, maxWidth: 380, margin: "0 auto 36px" }}>
              Run your first AI visibility scan to see your Readiness, Authority, and Influence scores — and get a personalised action plan.
            </p>
            <Link href="/" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 30px", borderRadius: 12,
              background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
              color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none",
              boxShadow: "0 0 36px rgba(41,82,227,0.42)",
            }}>
              Scan your first domain →
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

            {/* ── Left column ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Score overview */}
              <section style={{
                borderRadius: 22, padding: "30px 32px",
                background: CARD, border: `1px solid ${BORDER}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
                      {pendingScan!.domain}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>Just scanned</div>
                  </div>
                  <button style={{
                    fontSize: 12, fontWeight: 600, color: "rgba(100,140,255,0.8)",
                    background: "rgba(41,82,227,0.1)", border: "1px solid rgba(41,82,227,0.22)",
                    borderRadius: 9, padding: "8px 18px", cursor: "pointer",
                    fontFamily: "var(--font-geist-sans)",
                  }}>
                    Rescan
                  </button>
                </div>

                {/* Rings */}
                <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 28 }}>
                  <ScoreRing value={pendingScan!.readiness} label="AI Readiness" sublabel="Technical" />

                  {/* Authority — coming soon */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <div style={{ position: "relative", width: 130, height: 130 }}>
                      <svg width={130} height={130} viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx={65} cy={65} r={56} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={9} />
                      </svg>
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em" }}>SOON</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Authority</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>Semantic signals</div>
                    </div>
                  </div>

                  {/* Influence — locked */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <div style={{ position: "relative", width: 130, height: 130 }}>
                      <svg width={130} height={130} viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)", opacity: 0.3 }}>
                        <defs>
                          <linearGradient id="lockGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#F59E0B" />
                            <stop offset="100%" stopColor="#EF4444" />
                          </linearGradient>
                        </defs>
                        <circle cx={65} cy={65} r={56} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={9} />
                        <circle cx={65} cy={65} r={56} fill="none" stroke="url(#lockGrad)" strokeWidth={9} strokeLinecap="round" strokeDasharray="351.9" strokeDashoffset="211.1" />
                      </svg>
                      <div style={{
                        position: "absolute", inset: 0, borderRadius: "50%",
                        backdropFilter: "blur(3px)", background: "rgba(7,10,17,0.5)",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
                      }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em" }}>PREMIUM</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.06em" }}>AI Influence</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", marginTop: 2 }}>Mention tracking</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Score trend */}
              <section style={{ borderRadius: 22, padding: "24px 28px", background: CARD, border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: 16 }}>Score Trend</div>
                <div style={{
                  height: 110, borderRadius: 12, border: `1px dashed ${BORDER}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(255,255,255,0.015)",
                }}>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", textAlign: "center", lineHeight: 1.65, maxWidth: 260, margin: 0 }}>
                    Rescan after making improvements to see your progress over time.
                  </p>
                </div>
              </section>

              {/* Action checklist */}
              <section style={{ borderRadius: 22, padding: "24px 28px", background: CARD, border: `1px solid ${BORDER}` }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>AI Visibility Checklist</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>Complete these to improve your scores</div>
                </div>
                <ChecklistItem done={false} label="Add Organization JSON-LD schema" points={15} />
                <ChecklistItem done={false} label="Add answer-first content to homepage" points={15} />
                <ChecklistItem done={false} label="Add article:published_time meta tag" points={5} />
                <ChecklistItem done={true} label="llms.txt is in place" points={0} />
                <ChecklistItem done={true} label="Robots.txt allows AI bots" points={0} />
              </section>

              {/* Issue tracker */}
              <section style={{ borderRadius: 22, padding: "24px 28px", background: CARD, border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 18 }}>Technical Issues</div>
                <div style={{ display: "flex", gap: 20, marginBottom: 18 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#F87171" }}>● 3 critical</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#4ADE80" }}>✓ 2 resolved</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>4 passing</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                  {["Schema.org missing", "Answer-first content low", "Entity links missing"].map((issue) => (
                    <div key={issue} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", borderRadius: 10,
                      background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)",
                    }}>
                      <span style={{ color: "#F87171", fontSize: 8, lineHeight: 1 }}>●</span>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", flex: 1 }}>{issue}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-geist-mono)" }}>Since first scan</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  {[{ label: "llms.txt added", date: "12 May" }, { label: "OG tags completed", date: "10 May" }].map((item) => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.28)" }}>
                      <span style={{ color: "#4ADE80" }}>✓</span>
                      {item.label}
                      <span style={{ marginLeft: "auto", fontSize: 11, fontFamily: "var(--font-geist-mono)" }}>Fixed {item.date}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* ── Right column ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* AI Intelligence panel */}
              <section style={{
                borderRadius: 22, padding: "24px",
                background: "linear-gradient(160deg, rgba(41,82,227,0.09) 0%, rgba(7,10,17,0) 55%)",
                border: "1px solid rgba(41,82,227,0.2)",
                position: "sticky", top: 78,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 20 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 16px rgba(41,82,227,0.4)",
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>AI Intelligence</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>Powered by Claude</div>
                  </div>
                </div>

                {pendingScan!.insight?.hero_text && (
                  <p style={{
                    fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.72)", lineHeight: 1.65,
                    marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}>
                    {pendingScan!.insight.hero_text}
                  </p>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {pendingScan!.insight?.strongest_point && (
                    <InsightCard
                      icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                      label="Strongest point"
                      text={pendingScan!.insight.strongest_point}
                      borderColor="rgba(74,222,128,0.2)" bgColor="rgba(74,222,128,0.05)" labelColor="#4ADE80"
                    />
                  )}
                  {pendingScan!.insight?.critical_gap && (
                    <InsightCard
                      icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
                      label="Critical gap"
                      text={pendingScan!.insight.critical_gap}
                      borderColor="rgba(248,113,113,0.2)" bgColor="rgba(248,113,113,0.05)" labelColor="#F87171"
                    />
                  )}
                  {pendingScan!.insight?.quick_win && (
                    <InsightCard
                      icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>}
                      label="Quick win"
                      text={pendingScan!.insight.quick_win}
                      borderColor="rgba(96,165,250,0.2)" bgColor="rgba(96,165,250,0.05)" labelColor="#60A5FA"
                    />
                  )}
                  {!pendingScan!.insight && (
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", lineHeight: 1.65 }}>
                      AI insights are generated during the scan. Run a new scan to see personalised recommendations.
                    </p>
                  )}
                </div>
              </section>

              {/* Active agent card */}
              <div style={{ borderRadius: 18, padding: "18px 20px", background: CARD, border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
                  Active Agent
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                    background: "linear-gradient(135deg, rgba(41,82,227,0.22), rgba(123,63,228,0.22))",
                    border: "1px solid rgba(41,82,227,0.22)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(100,140,255,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4l3 3" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.78)" }}>General Agent</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>Multi-sector analysis</div>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 8px #4ADE80", animation: "pulse-dot 2.5s ease infinite" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#4ADE80" }}>Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
