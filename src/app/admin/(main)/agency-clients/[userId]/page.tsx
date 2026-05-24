"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { SECTOR_META } from "@/lib/sectorMeta";

type ScanData = {
  readiness_score: number | null;
  authority_score: number | null;
  influence_score: number | null;
  insight: {
    hero_text?: string;
    strongest_point?: string;
    critical_gap?: string;
    quick_win?: string;
  } | null;
  issues: { issue: string; status: string }[] | null;
  created_at: string;
};

type AgencyClientDomain = {
  id: string;
  domain: string;
  sector: string | null;
  nickname: string | null;
  created_at: string;
  lastScan: ScanData | null;
};

type PageProps = { params: Promise<{ userId: string }> };

const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

function scoreColor(s: number | null): string {
  if (!s) return "#6B7280";
  if (s >= 71) return "#10B981";
  if (s >= 41) return "#F59E0B";
  return "#EF4444";
}

function avgScore(scan: ScanData | null): number | null {
  if (!scan) return null;
  const vals = [scan.readiness_score, scan.authority_score, scan.influence_score].filter((v): v is number => v != null);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

function formatDate(iso: string | null) {
  if (!iso) return "Never scanned";
  return new Date(iso).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

function parseInsight(raw: unknown): ScanData["insight"] {
  if (!raw) return null;
  if (typeof raw === "object") return raw as ScanData["insight"];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return null;
}

function parseIssues(raw: unknown): ScanData["issues"] {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw as ScanData["issues"];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return null;
}

function issueColor(status: string): string {
  if (status === "critical") return "#EF4444";
  if (status === "warning") return "#F59E0B";
  return "#10B981";
}
function issueIcon(status: string): string {
  if (status === "critical") return "🔴";
  if (status === "warning") return "⚠️";
  return "✅";
}

export default function AgencyClientDetailPage({ params }: PageProps) {
  const { userId } = use(params);

  const [domains, setDomains] = useState<AgencyClientDomain[]>([]);
  const [agencyEmail, setAgencyEmail] = useState("");
  const [selected, setSelected] = useState<AgencyClientDomain | null>(null);
  const [loading, setLoading] = useState(true);
  const [tipDraft, setTipDraft] = useState<{ subject: string; body: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const [clientsRes, usersRes] = await Promise.all([
        fetch(`/api/admin/agency-clients?userId=${userId}`, { headers: { "x-admin-secret": adminSecret } }),
        fetch("/api/admin/users", { headers: { "x-admin-secret": adminSecret } }),
      ]);
      const clientsData = await clientsRes.json();
      const usersData = await usersRes.json();

      const raw: AgencyClientDomain[] = (clientsData.clients ?? []).map((c: AgencyClientDomain) => ({
        ...c,
        lastScan: c.lastScan
          ? { ...c.lastScan, insight: parseInsight(c.lastScan.insight), issues: parseIssues(c.lastScan.issues) }
          : null,
      }));
      setDomains(raw);
      if (raw.length > 0) setSelected(raw[0]);

      const match = (usersData.users ?? []).find((u: { id: string; email: string }) => u.id === userId);
      if (match) setAgencyEmail(match.email);

      setLoading(false);
    }
    load();
  }, [userId]);

  useEffect(() => {
    if (!selected) return;
    const saved = localStorage.getItem(`admin_note_${selected.domain}`) ?? "";
    setNote(saved);
    setTipDraft(null);
    setSent(false);
  }, [selected?.domain]);

  async function generateTip() {
    if (!selected) return;
    setGenerating(true);
    setTipDraft(null);
    setSent(false);
    const res = await fetch("/api/admin/agency-clients/send-tip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agencyEmail,
        clientDomain: selected.domain,
        clientSector: selected.sector ?? "other",
        clientNickname: selected.nickname ?? selected.domain,
        readiness: selected.lastScan?.readiness_score ?? 0,
        authority: selected.lastScan?.authority_score ?? 0,
        influence: selected.lastScan?.influence_score ?? 0,
        topIssues: (selected.lastScan?.issues ?? []).slice(0, 3).map((i) => i.issue).join(", "),
        adminSecret,
      }),
    });
    const data = await res.json();
    setTipDraft({ subject: data.subject ?? "", body: data.body ?? "" });
    setGenerating(false);
  }

  async function sendEmail() {
    if (!selected || !tipDraft) return;
    setSending(true);
    await fetch("/api/admin/agency-clients/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agencyEmail,
        clientDomain: selected.domain,
        sector: selected.sector ?? "other",
        subject: tipDraft.subject,
        body: tipDraft.body,
        adminSecret,
      }),
    });
    setSent(true);
    setSending(false);
  }

  function saveNote() {
    if (!selected) return;
    localStorage.setItem(`admin_note_${selected.domain}`, note);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  }

  const sectorEmoji = (sector: string | null) => SECTOR_META[sector ?? ""]?.emoji ?? "🌐";
  const sectorName = (sector: string | null) => SECTOR_META[sector ?? ""]?.name ?? (sector ?? "Other");

  if (loading) {
    return <div style={{ padding: 32, color: "var(--ink-500)", fontSize: 14 }}>Loading...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--ink-0)" }}>
        <Link href="/admin/users" style={{ fontSize: 13, color: "var(--ink-500)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          ← Back to Users
        </Link>
        <span style={{ color: "var(--border)" }}>|</span>
        <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "#FEF3C7", color: "#92400E" }}>
          Agency: {agencyEmail || userId}
        </span>
        <span style={{ fontSize: 12, color: "var(--ink-400)" }}>{domains.length} client domain{domains.length !== 1 ? "s" : ""}</span>
      </div>

      {/* 2-column layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left panel */}
        <div style={{ width: 280, borderRight: "1px solid var(--border)", overflowY: "auto", background: "var(--ink-0)", padding: "12px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 8px 8px" }}>
            Client Domains ({domains.length})
          </p>
          {domains.length === 0 && (
            <p style={{ fontSize: 13, color: "var(--ink-400)", padding: "8px" }}>No domains found.</p>
          )}
          {domains.map((d) => {
            const avg = avgScore(d.lastScan);
            const isActive = selected?.id === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelected(d)}
                style={{
                  width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                  border: isActive ? "1.5px solid #4B7BFF" : "1px solid var(--border)",
                  background: isActive ? "#EFF4FF" : "var(--bg)",
                  transition: "border 0.1s, background 0.1s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-800)" }}>
                    {sectorEmoji(d.sector)} {d.nickname ?? d.domain}
                  </span>
                  {avg != null ? (
                    <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(avg), background: `${scoreColor(avg)}18`, padding: "1px 7px", borderRadius: 20 }}>
                      {avg}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: "var(--ink-400)" }}>—</span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "var(--ink-400)", margin: 0 }}>{d.domain}</p>
                {!d.lastScan && <p style={{ fontSize: 11, color: "#F59E0B", margin: "3px 0 0", fontStyle: "italic" }}>No scan yet</p>}
              </button>
            );
          })}
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", background: "var(--bg)" }}>
          {!selected ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--ink-400)", fontSize: 14 }}>
              👈 Select a client to view details
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 820 }}>
              {/* Header */}
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-900)", margin: "0 0 4px" }}>
                  {sectorEmoji(selected.sector)} {selected.nickname ? `${selected.nickname} — ${selected.domain}` : selected.domain}
                </h2>
                <p style={{ fontSize: 13, color: "var(--ink-500)", margin: 0 }}>
                  {sectorName(selected.sector)} · Last scan: {formatDate(selected.lastScan?.created_at ?? null)}
                </p>
              </div>

              {/* Score cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { label: "AI READINESS", val: selected.lastScan?.readiness_score ?? null },
                  { label: "AI AUTHORITY", val: selected.lastScan?.authority_score ?? null },
                  { label: "AI INFLUENCE", val: selected.lastScan?.influence_score ?? null },
                ].map(({ label, val }) => (
                  <div key={label} style={{ padding: "16px 18px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--ink-0)" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>{label}</p>
                    <p style={{ fontSize: 32, fontWeight: 800, color: scoreColor(val), margin: "0 0 8px", lineHeight: 1 }}>
                      {val ?? "—"}
                    </p>
                    <div style={{ height: 4, borderRadius: 4, background: "var(--ink-100)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${val ?? 0}%`, background: scoreColor(val), borderRadius: 4, transition: "width 0.4s" }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Top Issues */}
              <div style={{ padding: "16px 18px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--ink-0)" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>Top Issues</p>
                {selected.lastScan?.issues && selected.lastScan.issues.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selected.lastScan.issues.slice(0, 5).map((issue, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <span>{issueIcon(issue.status)}</span>
                        <span style={{ fontSize: 13, color: issueColor(issue.status), lineHeight: 1.5 }}>{issue.issue}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: "var(--ink-400)", margin: 0 }}>No issues data — run a scan first</p>
                )}
              </div>

              {/* AI Insight */}
              {selected.lastScan?.insight && (
                <div style={{ padding: "16px 18px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--ink-0)" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>AI Insight</p>
                  {selected.lastScan.insight.hero_text && (
                    <p style={{ fontSize: 13, color: "var(--ink-700)", lineHeight: 1.6, padding: "10px 14px", background: "var(--ink-50)", borderRadius: 8, marginBottom: 12 }}>
                      {selected.lastScan.insight.hero_text}
                    </p>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[
                      { icon: "💚", label: "Strongest Point", val: selected.lastScan.insight.strongest_point },
                      { icon: "🔴", label: "Critical Gap", val: selected.lastScan.insight.critical_gap },
                      { icon: "⚡", label: "Quick Win", val: selected.lastScan.insight.quick_win },
                    ].map(({ icon, label, val }) => val && (
                      <div key={label} style={{ padding: "10px 12px", borderRadius: 8, background: "var(--ink-50)", border: "1px solid var(--border)" }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-500)", margin: "0 0 4px" }}>{icon} {label}</p>
                        <p style={{ fontSize: 12, color: "var(--ink-700)", lineHeight: 1.5, margin: 0 }}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div style={{ padding: "16px 18px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--ink-0)" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>Notes</p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="Add internal notes about this client..."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink-800)", fontSize: 13, lineHeight: 1.6, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <button
                    onClick={saveNote}
                    style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--ink-800)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                  >
                    Save Note
                  </button>
                  {noteSaved && <span style={{ fontSize: 13, color: "#10B981" }}>✅ Saved</span>}
                </div>
              </div>

              {/* Generate Tip */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <button
                  onClick={generateTip}
                  disabled={generating}
                  style={{ alignSelf: "flex-start", padding: "9px 20px", borderRadius: 8, border: "none", background: "var(--ink-800)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.6 : 1 }}
                >
                  {generating ? "Generating..." : "✨ Generate Tip Email"}
                </button>

                {tipDraft && (
                  <div style={{ padding: "16px 18px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--ink-0)", display: "flex", flexDirection: "column", gap: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>📧 Email Preview</p>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Subject</label>
                      <input
                        type="text"
                        value={tipDraft.subject}
                        onChange={(e) => setTipDraft({ ...tipDraft, subject: e.target.value })}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink-800)", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Body</label>
                      <textarea
                        rows={8}
                        value={tipDraft.body}
                        onChange={(e) => setTipDraft({ ...tipDraft, body: e.target.value })}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink-800)", fontSize: 13, lineHeight: 1.6, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button
                        onClick={sendEmail}
                        disabled={sending || sent}
                        style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: sent ? "#10B981" : "#4B7BFF", color: "#fff", fontSize: 13, fontWeight: 600, cursor: (sending || sent) ? "not-allowed" : "pointer", opacity: sending ? 0.6 : 1 }}
                      >
                        {sending ? "Sending..." : sent ? "✅ Sent" : "📧 Send to Agency"}
                      </button>
                      {sent && (
                        <span style={{ fontSize: 13, color: "#10B981" }}>Email sent to {agencyEmail}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
