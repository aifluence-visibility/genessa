"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/admin/ui/panel";
import { PageHeader } from "@/components/admin/ui/page-header";

type Campaign = {
  audience: string;
  subject: string;
  goal: string;
  send_day: string;
  brief: string;
};

const SECTORS = [
  { key: "restaurant", label: "Restaurant" },
  { key: "hotel", label: "Hotel" },
  { key: "clinic", label: "Clinic" },
  { key: "saas", label: "SaaS" },
  { key: "ecommerce", label: "E-Commerce" },
  { key: "creator", label: "Creator" },
  { key: "legal", label: "Legal" },
  { key: "other", label: "Other" },
];

const AUDIENCE_OPTIONS = [
  { key: "all", label: "All Users" },
  { key: "free", label: "Free Users" },
  { key: "premium", label: "Premium Users" },
  { key: "agency", label: "Agency Users" },
];

const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

const GOAL_STYLES: Record<string, { bg: string; color: string }> = {
  convert: { bg: "#EFF6FF", color: "#1D4ED8" },
  retain:  { bg: "#F0FDF4", color: "#16A34A" },
  upsell:  { bg: "#FAF5FF", color: "#7C3AED" },
};

function GoalBadge({ goal }: { goal: string }) {
  const style = GOAL_STYLES[goal.toLowerCase()] ?? { bg: "#F9FAFB", color: "#6B7280" };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: style.bg, color: style.color, letterSpacing: "0.04em" }}>
      {goal.toUpperCase()}
    </span>
  );
}

function toAudienceKey(audience: string): string {
  const l = audience.toLowerCase();
  if (l.includes("agency")) return "agency";
  if (l.includes("premium")) return "premium";
  if (l.includes("free")) return "free";
  return "all";
}

const fieldStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", borderRadius: 7,
  border: "1px solid var(--border)", background: "var(--bg)",
  color: "var(--ink-800)", fontSize: 13,
};

export default function ContentPage() {
  const router = useRouter();

  // ── Section 1 ──
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // ── Section 2 ──
  const [subject, setSubject] = useState("");
  const [audience, setAudience] = useState("all");
  const [sector, setSector] = useState("restaurant");
  const [context, setContext] = useState("");
  const [preview, setPreview] = useState("");
  const [body, setBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  async function generateWeeklyPlan() {
    setPlanLoading(true);
    setPlanError(null);
    try {
      const res = await fetch("/api/admin/content/weekly-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
      });
      const data = await res.json();
      if (data.error) { setPlanError(data.error); return; }
      setCampaigns(data.campaigns ?? []);
    } catch {
      setPlanError("Request failed");
    } finally {
      setPlanLoading(false);
    }
  }

  function draftEmail(campaign: Campaign) {
    localStorage.setItem("email_draft", JSON.stringify({
      subject: campaign.subject,
      audience: toAudienceKey(campaign.audience),
    }));
    router.push("/admin/emails");
  }

  async function generateDraft() {
    setGenerating(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/admin/content/email-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
        body: JSON.stringify({ subject, audience, context, sector }),
      });
      const data = await res.json();
      if (data.subject) setSubject(data.subject);
      if (data.preview) setPreview(data.preview);
      if (data.body) setBody(data.body);
    } finally {
      setGenerating(false);
    }
  }

  async function sendCampaign() {
    const label = AUDIENCE_OPTIONS.find((a) => a.key === audience)?.label ?? audience;
    if (!confirm(`Send to ${label}? This cannot be undone.`)) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/admin/content/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, audience, adminSecret }),
      });
      const data = await res.json();
      setSendResult(data.success ? `✅ Sent to ${data.sent} users` : `❌ ${data.error}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <PageHeader title="Content" description="AI-powered email planning and campaign creation." />

      {/* ── Section 1: Weekly Email Recommendations ── */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--ink-800)]">📬 Weekly Email Recommendations</h2>
          <p className="mt-0.5 text-sm text-[var(--ink-500)]">AI suggests who to contact and what to send this week</p>
        </div>

        <Panel>
          <button
            onClick={generateWeeklyPlan}
            disabled={planLoading}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "var(--ink-800)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: planLoading ? "not-allowed" : "pointer", opacity: planLoading ? 0.7 : 1 }}
          >
            {planLoading ? "Analyzing data..." : "Generate This Week's Plan"}
          </button>
          {planError && <p style={{ marginTop: 8, fontSize: 12, color: "#DC2626" }}>⚠️ {planError}</p>}
        </Panel>

        {campaigns.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {campaigns.map((c, i) => (
              <Panel key={i}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-500)" }}>TO:</span>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: "#EFF6FF", color: "#1E40AF" }}>
                        {c.audience}
                      </span>
                      <GoalBadge goal={c.goal} />
                    </div>
                    <span style={{ fontSize: 11, color: "var(--ink-400)" }}>📅 {c.send_day}</span>
                  </div>

                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Subject</p>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-800)" }}>{c.subject}</p>
                  </div>

                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Brief</p>
                    <p style={{ fontSize: 13, color: "var(--ink-600)", lineHeight: 1.55 }}>{c.brief}</p>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => draftEmail(c)}
                      style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--ink-0)", color: "var(--ink-700)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      ✍️ Draft This Email
                    </button>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </section>

      {/* ── Section 2: Compose & Send ── */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--ink-800)]">✉️ Compose & Send</h2>
        </div>

        <Panel>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your weekly AI visibility update"
                style={fieldStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Audience</label>
                <select value={audience} onChange={(e) => setAudience(e.target.value)} style={fieldStyle}>
                  {AUDIENCE_OPTIONS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Sector Voice</label>
                <select value={sector} onChange={(e) => setSector(e.target.value)} style={fieldStyle}>
                  {SECTORS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>
                Context <span style={{ fontWeight: 400, color: "var(--ink-400)" }}>(optional)</span>
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="What's this email about?"
                rows={2}
                style={{ ...fieldStyle, resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            <button
              onClick={generateDraft}
              disabled={generating || !subject}
              style={{ alignSelf: "flex-start", padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--ink-0)", color: "var(--ink-800)", fontSize: 13, fontWeight: 600, cursor: (generating || !subject) ? "not-allowed" : "pointer", opacity: (generating || !subject) ? 0.7 : 1 }}
            >
              {generating ? "Generating..." : "✨ Generate Draft"}
            </button>

            {(body || preview) && (
              <>
                <div style={{ height: 1, background: "var(--border)" }} />

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Preview Text</label>
                  <input
                    type="text"
                    value={preview}
                    onChange={(e) => setPreview(e.target.value)}
                    style={fieldStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Body</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={8}
                    style={{ ...fieldStyle, lineHeight: 1.6, resize: "vertical", fontFamily: "inherit" }}
                  />
                </div>

                <button
                  onClick={sendCampaign}
                  disabled={sending || !body}
                  style={{ alignSelf: "flex-start", padding: "9px 20px", borderRadius: 8, border: "none", background: "#111827", color: "#fff", fontSize: 13, fontWeight: 600, cursor: (sending || !body) ? "not-allowed" : "pointer", opacity: (sending || !body) ? 0.7 : 1 }}
                >
                  {sending ? "Sending..." : "Send Campaign"}
                </button>

                {sendResult && (
                  <p style={{ fontSize: 13, color: sendResult.startsWith("✅") ? "#059669" : "#DC2626" }}>{sendResult}</p>
                )}
              </>
            )}
          </div>
        </Panel>
      </section>
    </div>
  );
}
