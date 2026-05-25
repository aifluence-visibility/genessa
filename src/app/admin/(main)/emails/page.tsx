"use client";

import { useState, useEffect } from "react";
import { Panel } from "@/components/admin/ui/panel";
import { PageHeader } from "@/components/admin/ui/page-header";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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

type EmailSend = {
  id: string;
  subject: string;
  audience: string;
  recipient_count: number;
  sent_at: string;
};

const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

export default function EmailsPage() {
  const supabase = createSupabaseBrowserClient();

  const [subject, setSubject] = useState("");
  const [audience, setAudience] = useState("all");
  const [sector, setSector] = useState("restaurant");
  const [context, setContext] = useState("");
  const [preview, setPreview] = useState("");
  const [body, setBody] = useState("");

  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const [history, setHistory] = useState<EmailSend[]>([]);

  useEffect(() => {
    const draft = localStorage.getItem("email_draft");
    if (draft) {
      try {
        const { subject: s, audience: a } = JSON.parse(draft);
        if (s) setSubject(s);
        if (a) setAudience(a);
      } catch { /* ignore */ }
      localStorage.removeItem("email_draft");
    }

    supabase
      .from("email_sends")
      .select("id, subject, audience, recipient_count, sent_at")
      .order("sent_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setHistory((data ?? []) as EmailSend[]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const audienceLabel = AUDIENCE_OPTIONS.find((a) => a.key === audience)?.label ?? audience;
    if (!confirm(`Send to ${audienceLabel}? This cannot be undone.`)) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/admin/content/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, audience, adminSecret }),
      });
      const data = await res.json();
      if (data.success) {
        setSendResult(`✅ Sent to ${data.sent} users`);
        // refresh history
        const { data: newHistory } = await supabase
          .from("email_sends")
          .select("id, subject, audience, recipient_count, sent_at")
          .order("sent_at", { ascending: false })
          .limit(20);
        setHistory((newHistory ?? []) as EmailSend[]);
      } else {
        setSendResult(`❌ Error: ${data.error}`);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader title="Emails" description="Create and send campaigns to your users." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(0, 340px)", gap: 24, alignItems: "start" }}>
        {/* Left — Campaign builder */}
        <Panel>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>New Campaign</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your weekly AI visibility update"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink-800)", fontSize: 13 }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink-800)", fontSize: 13 }}
                >
                  {AUDIENCE_OPTIONS.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Sector Voice</label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink-800)", fontSize: 13 }}
                >
                  {SECTORS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Context <span style={{ fontWeight: 400, color: "var(--ink-400)" }}>(optional)</span></label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="What's this email about?"
                rows={2}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink-800)", fontSize: 13, resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            <button
              onClick={generateDraft}
              disabled={generating || !subject}
              style={{ alignSelf: "flex-start", padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--ink-0)", color: "var(--ink-800)", fontSize: 13, fontWeight: 600, cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.7 : 1 }}
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
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink-800)", fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Body</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={8}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink-800)", fontSize: 13, lineHeight: 1.6, resize: "vertical", fontFamily: "inherit" }}
                  />
                </div>

                <button
                  onClick={sendCampaign}
                  disabled={sending || !body}
                  style={{ alignSelf: "flex-start", padding: "9px 20px", borderRadius: 8, border: "none", background: "#111827", color: "#fff", fontSize: 13, fontWeight: 600, cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.7 : 1 }}
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

        {/* Right — History */}
        <Panel>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Send History</p>
          {history.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--ink-400)" }}>No campaigns sent yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {history.map((h) => (
                <div key={h.id} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)" }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-800)", marginBottom: 4 }}>{h.subject}</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "var(--ink-500)" }}>{h.audience}</span>
                    <span style={{ fontSize: 11, color: "var(--ink-500)" }}>·</span>
                    <span style={{ fontSize: 11, color: "var(--ink-500)" }}>{h.recipient_count} sent</span>
                    <span style={{ fontSize: 11, color: "var(--ink-500)" }}>·</span>
                    <span style={{ fontSize: 11, color: "var(--ink-400)" }}>{new Date(h.sent_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
