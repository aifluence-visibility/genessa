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

// ─── Top metric card (big number + thin arc) ──────────────────────────────────
function MetricCard({
  value, label, sublabel, gradId, locked, soon,
}: {
  value: number | null; label: string; sublabel: string;
  gradId: string; locked?: boolean; soon?: boolean;
}) {
  const active = !locked && !soon && value !== null;
  const displayed = useCounter(active ? value : null);
  const size = 64;
  const stroke = 2.5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = active ? circ * (1 - (value as number) / 100) : circ;
  const arcStart = locked ? "#F59E0B" : "#2952E3";
  const arcEnd = locked ? "#EF4444" : "#7B3FE4";

  return (
    <div style={{
      flex: 1, padding: "26px 28px",
      background: "rgba(255,255,255,0.026)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 18, position: "relative", overflow: "hidden",
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)",
        textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14,
      }}>
        {label}
      </div>

      <div style={{
        fontSize: 72, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1,
        color: active ? "#fff" : "rgba(255,255,255,0.14)",
        fontFamily: "var(--font-geist-sans)", marginBottom: 10,
      }}>
        {active ? displayed : "—"}
      </div>

      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
        {locked ? "Premium feature" : soon ? "Coming soon" : sublabel}
      </div>

      {(locked || soon) && (
        <div style={{
          marginTop: 14,
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 9px", borderRadius: 999,
          background: locked ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.06)",
          border: locked ? "1px solid rgba(245,158,11,0.18)" : "1px solid rgba(255,255,255,0.08)",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
          color: locked ? "#F59E0B" : "rgba(255,255,255,0.3)",
        }}>
          {locked && (
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
          {locked ? "PREMIUM" : "SOON"}
        </div>
      )}

      {/* Thin arc — top right corner */}
      <div style={{ position: "absolute", top: 20, right: 20, opacity: (locked || soon) ? 0.28 : 1 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={arcStart} />
              <stop offset="100%" stopColor={arcEnd} />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
          {!soon && (
            <circle
              cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.32, 0, 0.67, 0)" }}
            />
          )}
        </svg>
      </div>
    </div>
  );
}

// ─── Insight row ───────────────────────────────────────────────────────────────
function InsightRow({ icon, label, text, color }: { icon: ReactNode; label: string; text: string; color: string }) {
  return (
    <div style={{ display: "flex", gap: 14, padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
          {label}
        </div>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.65, margin: 0 }}>{text}</p>
      </div>
    </div>
  );
}

// ─── Checklist item ────────────────────────────────────────────────────────────
function ChecklistItem({ done, label, points }: { done: boolean; label: string; points: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{
        width: 17, height: 17, borderRadius: 5, flexShrink: 0,
        border: done ? "none" : "1.5px solid rgba(255,255,255,0.18)",
        background: done ? "#22C55E" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {done && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span style={{ flex: 1, fontSize: 13, color: done ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.72)", textDecoration: done ? "line-through" : "none" }}>
        {label}
      </span>
      {!done && (
        <span style={{ fontSize: 11, fontWeight: 600, color: "#5B8EF0", fontFamily: "var(--font-geist-mono)", whiteSpace: "nowrap" }}>
          +{points}
        </span>
      )}
    </div>
  );
}

// ─── Sidebar nav item ──────────────────────────────────────────────────────────
function NavItem({ icon, label, active, href }: { icon: ReactNode; label: string; active?: boolean; href?: string }) {
  const inner = (
    <div style={{
      display: "flex", alignItems: "center", gap: 9,
      padding: "8px 10px", borderRadius: 8, marginBottom: 2,
      background: active ? "rgba(255,255,255,0.07)" : "transparent",
      color: active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
      cursor: "pointer",
    }}>
      {icon}
      <span style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>{label}</span>
    </div>
  );
  if (href) return <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link>;
  return inner;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0A0F" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 700ms linear infinite}`}</style>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div className="spin" style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.06)", borderTopColor: "#2952E3" }} />
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.22)" }}>Loading…</span>
        </div>
      </div>
    );
  }

  const hasScan = pendingScan !== null;
  const BORDER = "rgba(255,255,255,0.08)";
  const CARD = "rgba(255,255,255,0.026)";

  const issues = [
    { issue: "Schema.org missing",        status: "critical" as const },
    { issue: "Answer-first content low",  status: "critical" as const },
    { issue: "Entity links missing",      status: "critical" as const },
    { issue: "llms.txt added",            status: "fixed"    as const },
    { issue: "OG tags completed",         status: "fixed"    as const },
    { issue: "Robots.txt configured",     status: "passing"  as const },
    { issue: "HTTPS active",              status: "passing"  as const },
    { issue: "Page speed acceptable",     status: "passing"  as const },
    { issue: "Sitemap present",           status: "passing"  as const },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0A0A0F", color: "#fff", overflow: "hidden" }}>

      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes spin { to { transform: rotate(360deg) } }
        .spin { animation: spin 700ms linear infinite }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 4px }
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 224, flexShrink: 0,
        borderRight: `1px solid ${BORDER}`,
        display: "flex", flexDirection: "column",
        background: "rgba(255,255,255,0.012)",
      }}>
        {/* Logo */}
        <div style={{ padding: "22px 20px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{
              fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
              WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
            }}>
              Genessa
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          <NavItem
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>}
            label="Dashboard" active
          />
          <NavItem
            href="/"
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>}
            label="New scan"
          />
        </nav>

        {/* Agent status */}
        <div style={{ padding: "14px 16px", borderTop: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
            Active Agent
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: "linear-gradient(135deg, rgba(41,82,227,0.25), rgba(123,63,228,0.25))",
              border: "1px solid rgba(41,82,227,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(120,155,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.72)" }}>General Agent</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ADE80", animation: "pulse-dot 2.5s ease infinite" }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: "#4ADE80" }}>Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* User */}
        <div style={{ padding: "14px 16px 20px", borderTop: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 10, wordBreak: "break-all", lineHeight: 1.4 }}>
            {user?.email}
          </div>
          <button
            onClick={handleSignOut}
            style={{
              width: "100%", fontSize: 12, fontWeight: 500,
              color: "rgba(255,255,255,0.32)",
              background: "none", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 7, padding: "7px 12px", cursor: "pointer",
              fontFamily: "var(--font-geist-sans)", textAlign: "center",
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, overflowY: "auto", padding: "36px 40px 80px" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(41,82,227,0.55)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              AI Visibility Control Center
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.04em", margin: 0, color: "#fff" }}>
              Dashboard
            </h1>
          </div>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10,
            background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
            color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none",
            boxShadow: "0 0 24px rgba(41,82,227,0.32)",
          }}>
            + Run a scan
          </Link>
        </div>

        {!hasScan ? (
          /* ── Empty state ── */
          <div style={{
            border: "1px dashed rgba(255,255,255,0.09)", borderRadius: 22,
            padding: "96px 32px", textAlign: "center",
            background: "linear-gradient(180deg, rgba(41,82,227,0.04) 0%, transparent 100%)",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", margin: "0 auto 24px",
              background: "linear-gradient(135deg, rgba(41,82,227,0.14), rgba(123,63,228,0.14))",
              border: "1px solid rgba(41,82,227,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(100,140,255,0.68)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 10px", color: "#fff" }}>
              No scans yet
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.33)", lineHeight: 1.7, maxWidth: 360, margin: "0 auto 32px" }}>
              Run your first AI visibility scan to get your Readiness, Authority, and Influence scores — and a personalised action plan.
            </p>
            <Link href="/" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "13px 28px", borderRadius: 11,
              background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
              color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none",
              boxShadow: "0 0 32px rgba(41,82,227,0.38)",
            }}>
              Scan your first domain →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* ── Top metric strip ── */}
            <div style={{ display: "flex", gap: 14 }}>
              <MetricCard
                value={pendingScan!.readiness}
                label="AI Readiness"
                sublabel="Technical infrastructure"
                gradId="arcGradReadiness"
              />
              <MetricCard
                value={pendingScan!.authority}
                label="Authority"
                sublabel="Semantic authority"
                gradId="arcGradAuthority"
                soon
              />
              <MetricCard
                value={pendingScan!.influence}
                label="AI Influence"
                sublabel="AI mention tracking"
                gradId="arcGradInfluence"
                locked
              />
            </div>

            {/* Domain / rescan bar */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "13px 18px", borderRadius: 12,
              background: CARD, border: `1px solid ${BORDER}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 7px #4ADE80", flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.78)" }}>
                  {pendingScan!.domain}
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>· Just scanned</span>
              </div>
              <button style={{
                fontSize: 12, fontWeight: 600, color: "rgba(100,140,255,0.8)",
                background: "rgba(41,82,227,0.1)", border: "1px solid rgba(41,82,227,0.18)",
                borderRadius: 8, padding: "6px 16px", cursor: "pointer",
                fontFamily: "var(--font-geist-sans)",
              }}>
                Rescan
              </button>
            </div>

            {/* ── Middle: AI Insight + Checklist/Issues ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14, alignItems: "start" }}>

              {/* AI Insight */}
              <section style={{
                borderRadius: 18, padding: "26px 28px",
                background: "linear-gradient(160deg, rgba(41,82,227,0.07) 0%, rgba(10,10,15,0) 60%)",
                border: "1px solid rgba(41,82,227,0.17)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 14px rgba(41,82,227,0.36)",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>AI Intelligence</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>Powered by Claude</div>
                  </div>
                </div>

                {pendingScan!.insight ? (
                  <>
                    {pendingScan!.insight.hero_text && (
                      <p style={{
                        fontSize: 17, fontWeight: 500, color: "rgba(255,255,255,0.82)",
                        lineHeight: 1.6, margin: "0 0 20px", paddingBottom: 20,
                        borderBottom: "1px solid rgba(255,255,255,0.07)",
                      }}>
                        {pendingScan!.insight.hero_text}
                      </p>
                    )}
                    <div>
                      {pendingScan!.insight.strongest_point && (
                        <InsightRow
                          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                          label="Strongest point" color="#4ADE80"
                          text={pendingScan!.insight.strongest_point}
                        />
                      )}
                      {pendingScan!.insight.critical_gap && (
                        <InsightRow
                          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
                          label="Critical gap" color="#F87171"
                          text={pendingScan!.insight.critical_gap}
                        />
                      )}
                      {pendingScan!.insight.quick_win && (
                        <InsightRow
                          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>}
                          label="Quick win" color="#60A5FA"
                          text={pendingScan!.insight.quick_win}
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.28)", lineHeight: 1.65 }}>
                    Run a scan to get AI-powered insights and recommendations.
                  </p>
                )}
              </section>

              {/* Right column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Checklist */}
                <section style={{ borderRadius: 18, padding: "20px 22px", background: CARD, border: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 3 }}>Quick Actions</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 14 }}>Fix these to improve your score</div>
                  <ChecklistItem done={false} label="Add Organization schema"        points={15} />
                  <ChecklistItem done={false} label="Answer-first homepage content"  points={15} />
                  <ChecklistItem done={false} label="article:published_time meta"    points={5} />
                  <ChecklistItem done={true}  label="llms.txt in place"              points={0} />
                  <ChecklistItem done={true}  label="Robots.txt allows AI bots"      points={0} />
                </section>

                {/* Issue summary */}
                <section style={{ borderRadius: 18, padding: "20px 22px", background: CARD, border: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>Issue Summary</div>
                  <div style={{ display: "flex", gap: 0 }}>
                    {[
                      { count: 3, label: "Critical", color: "#F87171", bg: "rgba(248,113,113,0.08)" },
                      { count: 2, label: "Fixed",    color: "#4ADE80", bg: "rgba(74,222,128,0.08)" },
                      { count: 4, label: "Passing",  color: "rgba(255,255,255,0.4)", bg: "transparent" },
                    ].map((item, i) => (
                      <div key={i} style={{ flex: 1, padding: "12px 0", textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                        <div style={{ fontSize: 26, fontWeight: 700, color: item.color, letterSpacing: "-0.04em" }}>{item.count}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: item.color, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 2 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            {/* ── Bottom: Technical Issues table ── */}
            <section style={{ borderRadius: 18, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
              <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER}`, background: CARD }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Technical Issues</div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.012)" }}>
                    {["Issue", "Status", "Since"].map((h, i) => (
                      <th key={h} style={{
                        padding: "10px 24px", textAlign: i === 2 ? "right" : "left",
                        fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.22)",
                        textTransform: "uppercase", letterSpacing: "0.08em",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {issues.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "12px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                            background: row.status === "critical" ? "#F87171" : row.status === "fixed" ? "#4ADE80" : "rgba(255,255,255,0.2)",
                          }} />
                          <span style={{
                            fontSize: 13,
                            color: row.status === "fixed" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.68)",
                            textDecoration: row.status === "fixed" ? "line-through" : "none",
                          }}>
                            {row.issue}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          background: row.status === "critical" ? "rgba(248,113,113,0.1)" : row.status === "fixed" ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)",
                          color: row.status === "critical" ? "#F87171" : row.status === "fixed" ? "#4ADE80" : "rgba(255,255,255,0.32)",
                          border: `1px solid ${row.status === "critical" ? "rgba(248,113,113,0.2)" : row.status === "fixed" ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.07)"}`,
                        }}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 24px", textAlign: "right", fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-geist-mono)" }}>
                        {row.status === "fixed" ? "Fixed" : "First scan"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

          </div>
        )}
      </main>
    </div>
  );
}
