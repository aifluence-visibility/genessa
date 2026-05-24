"use client";

import { useState } from "react";
import { Panel } from "@/components/admin/ui/panel";
import { PageHeader } from "@/components/admin/ui/page-header";

const SECTORS = [
  { key: "all", label: "All Sectors" },
  { key: "restaurant", label: "Restaurant" },
  { key: "hotel", label: "Hotel" },
  { key: "clinic", label: "Clinic" },
  { key: "saas", label: "SaaS" },
  { key: "ecommerce", label: "E-Commerce" },
  { key: "creator", label: "Creator" },
  { key: "legal", label: "Legal" },
  { key: "other", label: "Other" },
];

type Tab = "calendar" | "outreach" | "report";

const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, border: "1px solid var(--border)", background: "var(--ink-0)", color: "var(--ink-600)", cursor: "pointer", whiteSpace: "nowrap" }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

type CalendarDay = { day: number; platform: string; topic: string; hook: string; time: string };
type OutreachResult = { linkedin_connect: string; linkedin_followup: string; email_subject: string; email_body: string };

export default function MarketingPage() {
  const [tab, setTab] = useState<Tab>("calendar");

  // Calendar state
  const [calSector, setCalSector] = useState("restaurant");
  const [calWeek, setCalWeek] = useState("This Week");
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);

  // Outreach state
  const [outSector, setOutSector] = useState("restaurant");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [outreach, setOutreach] = useState<OutreachResult | null>(null);

  // Report state
  const [period, setPeriod] = useState("This Week");
  const [report, setReport] = useState("");

  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      if (tab === "calendar") {
        const res = await fetch("/api/admin/marketing/content-calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
          body: JSON.stringify({ sector: calSector, week: calWeek }),
        });
        const data = await res.json();
        setCalendar(data.calendar ?? []);
      } else if (tab === "outreach") {
        const res = await fetch("/api/admin/marketing/outreach", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
          body: JSON.stringify({ sector: outSector, companyName, contactName }),
        });
        const data = await res.json();
        setOutreach(data);
      } else {
        const res = await fetch("/api/admin/marketing/growth-report", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
          body: JSON.stringify({ period }),
        });
        const data = await res.json();
        setReport(data.report ?? "");
      }
    } finally {
      setLoading(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "calendar", label: "Content Calendar" },
    { key: "outreach", label: "Outreach" },
    { key: "report", label: "Growth Report" },
  ];

  const platformColor: Record<string, string> = {
    LinkedIn: "#0A66C2",
    Twitter: "#1DA1F2",
    Blog: "#6B7280",
    Instagram: "#E1306C",
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader title="Marketing" description="AI-powered content calendar, outreach, and growth strategy." />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer",
              background: "none", border: "none",
              borderBottom: tab === t.key ? "2px solid var(--ink-800)" : "2px solid transparent",
              color: tab === t.key ? "var(--ink-800)" : "var(--ink-500)",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content Calendar */}
      {tab === "calendar" && (
        <>
          <Panel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Sector</label>
                <select value={calSector} onChange={(e) => setCalSector(e.target.value)} style={selectStyle}>
                  {SECTORS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Week</label>
                <select value={calWeek} onChange={(e) => setCalWeek(e.target.value)} style={selectStyle}>
                  <option>This Week</option>
                  <option>Next Week</option>
                </select>
              </div>
              <GenerateBtn loading={loading} onClick={generate} label="Generate Calendar" />
            </div>
          </Panel>

          {calendar.length > 0 && (
            <Panel padding="p-0">
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Day", "Platform", "Topic", "Hook", "Time", ""].map((h) => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calendar.map((row) => (
                      <tr key={row.day} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={tdStyle}><strong style={{ color: "var(--ink-800)" }}>Day {row.day}</strong></td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: platformColor[row.platform] ?? "#6B7280", background: `${platformColor[row.platform] ?? "#6B7280"}15`, padding: "2px 8px", borderRadius: 20 }}>{row.platform}</span>
                        </td>
                        <td style={{ ...tdStyle, maxWidth: 200 }}>{row.topic}</td>
                        <td style={{ ...tdStyle, maxWidth: 260, color: "var(--ink-600)", fontStyle: "italic" }}>{row.hook}</td>
                        <td style={{ ...tdStyle, whiteSpace: "nowrap", color: "var(--ink-500)" }}>{row.time}</td>
                        <td style={tdStyle}><CopyButton text={row.hook} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </>
      )}

      {/* Outreach */}
      {tab === "outreach" && (
        <>
          <Panel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Sector</label>
                <select value={outSector} onChange={(e) => setOutSector(e.target.value)} style={selectStyle}>
                  {SECTORS.filter((s) => s.key !== "all").map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Company Name</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Restaurant" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Contact Name <span style={{ fontWeight: 400, color: "var(--ink-400)" }}>(optional)</span></label>
                <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="John" style={inputStyle} />
              </div>
              <GenerateBtn loading={loading} onClick={generate} label="Generate Outreach" disabled={!companyName} />
            </div>
          </Panel>

          {outreach && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <OutreachBox label="LinkedIn Connect" text={outreach.linkedin_connect} charLimit={300} />
              <OutreachBox label="LinkedIn Follow-up" text={outreach.linkedin_followup} charLimit={500} />
              <OutreachBox label="Email Subject" text={outreach.email_subject} />
              <OutreachBox label="Email Body" text={outreach.email_body} tall />
            </div>
          )}
        </>
      )}

      {/* Growth Report */}
      {tab === "report" && (
        <>
          <Panel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Period</label>
                <select value={period} onChange={(e) => setPeriod(e.target.value)} style={selectStyle}>
                  <option>This Week</option>
                  <option>Last 7 Days</option>
                  <option>This Month</option>
                </select>
              </div>
              <GenerateBtn loading={loading} onClick={generate} label="Generate Report" />
            </div>
          </Panel>

          {report && (
            <Panel>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Growth Report</p>
                <CopyButton text={report} />
              </div>
              <textarea
                readOnly
                value={report}
                style={{ width: "100%", minHeight: 360, padding: 12, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink-800)", fontSize: 13, lineHeight: 1.7, resize: "vertical", fontFamily: "inherit" }}
              />
            </Panel>
          )}
        </>
      )}
    </div>
  );
}

function GenerateBtn({ loading, onClick, label, disabled }: { loading: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "var(--ink-800)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: (loading || disabled) ? "not-allowed" : "pointer", opacity: (loading || disabled) ? 0.6 : 1, whiteSpace: "nowrap" }}
    >
      {loading ? "Generating..." : label}
    </button>
  );
}

function OutreachBox({ label, text, charLimit, tall }: { label: string; text: string; charLimit?: number; tall?: boolean }) {
  return (
    <Panel>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {charLimit && <span style={{ fontSize: 11, color: text.length > charLimit ? "#EF4444" : "var(--ink-400)" }}>{text.length}/{charLimit}</span>}
          <CopyButton text={text} />
        </div>
      </div>
      <p style={{ fontSize: 13, color: "var(--ink-700)", lineHeight: 1.6, whiteSpace: "pre-wrap", ...(tall ? { minHeight: 120 } : {}) }}>{text}</p>
    </Panel>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border)",
  background: "var(--ink-0)", color: "var(--ink-800)", fontSize: 13,
};

const inputStyle: React.CSSProperties = {
  padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border)",
  background: "var(--ink-0)", color: "var(--ink-800)", fontSize: 13, minWidth: 180,
};

const tdStyle: React.CSSProperties = { padding: "10px 14px", color: "var(--ink-700)", verticalAlign: "top" };

