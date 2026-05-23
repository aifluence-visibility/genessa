"use client";

import { useEffect, useState } from "react";
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

// ─── Score card ───────────────────────────────────────────────────────────────

function ScoreCard({
  label,
  score,
  delta,
  locked,
}: {
  label: string;
  score: number | null;
  delta: number | null;
  locked?: boolean;
}) {
  const deltaColor =
    delta === null ? "var(--fg-3)" : delta >= 0 ? "var(--score-good)" : "var(--score-bad)";

  return (
    <div
      style={{
        flex: 1,
        padding: "20px 22px",
        borderRadius: 14,
        border: "1px solid var(--border)",
        background: "var(--bg-subtle, var(--bg))",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {locked && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 14,
            backdropFilter: "blur(4px)",
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            zIndex: 2,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span style={{ fontSize: 12, color: "var(--fg-3)", fontWeight: 500 }}>
            Upgrade to unlock
          </span>
        </div>
      )}
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--fg-3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--fg)", lineHeight: 1 }}>
        {score ?? "—"}
      </div>
      {delta !== null && (
        <div style={{ marginTop: 8, fontSize: 13, color: deltaColor, fontWeight: 500 }}>
          {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)} pts from last scan
        </div>
      )}
      {delta === null && score !== null && (
        <div style={{ marginTop: 8, fontSize: 13, color: "var(--fg-3)" }}>
          First scan baseline
        </div>
      )}
    </div>
  );
}

// ─── Checklist item ────────────────────────────────────────────────────────────

function ChecklistItem({
  done,
  label,
  points,
}: {
  done: boolean;
  label: string;
  points: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          border: done ? "none" : "1.5px solid var(--border-strong)",
          background: done ? "var(--score-good)" : "transparent",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {done && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span style={{ flex: 1, fontSize: 14, color: done ? "var(--fg-3)" : "var(--fg)", textDecoration: done ? "line-through" : "none" }}>
        {label}
      </span>
      {!done && (
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--genessa-blue)", whiteSpace: "nowrap" }}>
          +{points} pts
        </span>
      )}
      {done && (
        <span style={{ fontSize: 12, color: "var(--score-good)", fontWeight: 500 }}>✓ Done</span>
      )}
    </div>
  );
}

// ─── Insight block ─────────────────────────────────────────────────────────────

function InsightBlock({
  icon,
  label,
  text,
  color,
}: {
  icon: string;
  label: string;
  text: string;
  color: string;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.55, margin: 0 }}>{text}</p>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

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
      try {
        setPendingScan(JSON.parse(raw));
      } catch { /* invalid JSON, ignore */ }
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 14, color: "var(--fg-3)" }}>Loading…</div>
      </div>
    );
  }

  const hasScan = pendingScan !== null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "0 32px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          background: "var(--bg)",
          zIndex: 10,
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              background: "var(--genessa-gradient)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Genessa
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "var(--fg-3)" }}>{user?.email}</span>
          <button
            onClick={handleSignOut}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--fg-2)",
              background: "none",
              border: "1px solid var(--border-strong)",
              borderRadius: 8,
              padding: "6px 14px",
              cursor: "pointer",
              fontFamily: "var(--font-geist-sans)",
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px" }}>

        {/* Page title + rescan */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>AI Visibility Control Center</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", margin: 0, color: "var(--fg)" }}>
              Dashboard
            </h1>
          </div>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 10,
              background: "var(--genessa-gradient)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            + Run a scan
          </Link>
        </div>

        {!hasScan ? (
          /* ── Empty state ── */
          <div
            style={{
              border: "1px dashed var(--border-strong)",
              borderRadius: 18,
              padding: "64px 32px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--genessa-gradient-soft, rgba(59,130,246,0.08))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--genessa-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 10px", color: "var(--fg)" }}>
              No scans yet
            </h2>
            <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, maxWidth: 380, margin: "0 auto 28px" }}>
              Run your first AI visibility scan to see your Readiness, Authority, and Influence scores — and get a personalised action plan.
            </p>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                borderRadius: 10,
                background: "var(--genessa-gradient)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              Scan your first domain →
            </Link>
          </div>
        ) : (
          /* ── Dashboard panels ── */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

            {/* Left column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Score overview */}
              <section
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 18,
                  padding: "24px",
                  background: "var(--bg)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)" }}>{pendingScan!.domain}</div>
                    <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>Just scanned</div>
                  </div>
                  <button
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--genessa-blue)",
                      background: "none",
                      border: "1px solid var(--border-strong)",
                      borderRadius: 8,
                      padding: "6px 14px",
                      cursor: "pointer",
                      fontFamily: "var(--font-geist-sans)",
                    }}
                  >
                    Rescan now
                  </button>
                </div>

                <div style={{ display: "flex", gap: 14 }}>
                  <ScoreCard label="AI Readiness" score={pendingScan!.readiness} delta={null} />
                  <ScoreCard label="Authority" score={pendingScan!.authority} delta={null} />
                  <ScoreCard label="AI Influence" score={null} delta={null} locked />
                </div>
              </section>

              {/* Trend graph placeholder */}
              <section
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 18,
                  padding: "24px",
                  background: "var(--bg)",
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", marginBottom: 16 }}>Score Trend</div>
                <div
                  style={{
                    height: 120,
                    borderRadius: 10,
                    background: "var(--bg-subtle, rgba(255,255,255,0.03))",
                    border: "1px dashed var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <p style={{ fontSize: 13, color: "var(--fg-3)", textAlign: "center", lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
                    Track your progress — rescan after making improvements to see your trend.
                  </p>
                </div>
              </section>

              {/* Action checklist */}
              <section
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 18,
                  padding: "24px",
                  background: "var(--bg)",
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>AI Visibility Checklist</div>
                <div style={{ fontSize: 13, color: "var(--fg-3)", marginBottom: 16 }}>Complete these to improve your scores</div>

                <ChecklistItem done={false} label="Add Organization JSON-LD schema" points={15} />
                <ChecklistItem done={false} label="Add answer-first content to homepage" points={15} />
                <ChecklistItem done={false} label="Add article:published_time meta tag" points={5} />
                <ChecklistItem done={true} label="llms.txt is in place" points={0} />
                <ChecklistItem done={true} label="Robots.txt allows AI bots" points={0} />
              </section>

              {/* Issue tracker */}
              <section
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 18,
                  padding: "24px",
                  background: "var(--bg)",
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>Technical Issues</div>
                <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--score-bad)" }}>● 3 critical</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--score-good)" }}>✓ 2 resolved</span>
                  <span style={{ fontSize: 13, color: "var(--fg-3)" }}>4 passing</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {[
                    "Schema.org missing",
                    "Answer-first content low",
                    "Entity links missing",
                  ].map((issue) => (
                    <div key={issue} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--fg-2)" }}>
                      <span style={{ color: "var(--score-bad)", fontSize: 16, lineHeight: 1 }}>●</span>
                      {issue}
                      <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--fg-3)" }}>Since first scan</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "llms.txt added", date: "12 May" },
                    { label: "OG tags completed", date: "10 May" },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--fg-3)" }}>
                      <span style={{ color: "var(--score-good)" }}>✓</span>
                      {item.label}
                      <span style={{ marginLeft: "auto", fontSize: 12 }}>Fixed {item.date}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right column — AI Insight Panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <section
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 18,
                  padding: "24px",
                  background: "var(--bg)",
                  position: "sticky",
                  top: 80,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", marginBottom: 18 }}>AI Intelligence</div>

                {pendingScan!.insight?.hero_text && (
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)", lineHeight: 1.6, marginBottom: 16 }}>
                    {pendingScan!.insight.hero_text}
                  </p>
                )}
                {pendingScan!.insight?.strongest_point && (
                  <InsightBlock
                    icon="✓"
                    label="Strongest point"
                    color="var(--score-good)"
                    text={pendingScan!.insight.strongest_point}
                  />
                )}
                {pendingScan!.insight?.critical_gap && (
                  <InsightBlock
                    icon="✗"
                    label="Critical gap"
                    color="var(--score-bad)"
                    text={pendingScan!.insight.critical_gap}
                  />
                )}
                {pendingScan!.insight?.quick_win && (
                  <InsightBlock
                    icon="💡"
                    label="Quick win"
                    color="var(--genessa-blue)"
                    text={pendingScan!.insight.quick_win}
                  />
                )}
                {!pendingScan!.insight && (
                  <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.6 }}>
                    AI insights are generated during the scan. Run a new scan to see personalised recommendations.
                  </p>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
