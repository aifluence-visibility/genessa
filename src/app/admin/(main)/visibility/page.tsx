"use client";

import { useState } from "react";
import { Panel } from "@/components/admin/ui/panel";
import { PageHeader } from "@/components/admin/ui/page-header";

const DEFAULT_QUERIES = [
  "What is the best AI visibility tool?",
  "How can I improve my AI search visibility?",
  "What tools help businesses appear in ChatGPT?",
  "Best AI SEO tools for restaurants",
  "How to get mentioned by AI systems?",
];

type VisibilityResult = {
  query: string;
  mentioned: boolean;
  excerpt: string;
  sentiment: "positive" | "neutral" | "negative";
};

type Competitor = {
  name: string;
  website: string;
  proposition: string;
  strengths: string[];
  weaknesses: string[];
  genessa_advantage: string;
};

const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

const sentimentLabel = {
  positive: { icon: "🟢", text: "Positive", color: "#10B981" },
  neutral: { icon: "🟡", text: "Neutral", color: "#F59E0B" },
  negative: { icon: "🔴", text: "Negative", color: "#EF4444" },
};

export default function VisibilityPage() {
  // Mention tracker
  const [selectedQueries, setSelectedQueries] = useState<string[]>([...DEFAULT_QUERIES]);
  const [customQuery, setCustomQuery] = useState("");
  const [extraQueries, setExtraQueries] = useState<string[]>([]);
  const [checkLoading, setCheckLoading] = useState(false);
  const [results, setResults] = useState<VisibilityResult[]>([]);

  // Competitor intelligence
  const [compLoading, setCompLoading] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);

  const allQueries = [...DEFAULT_QUERIES, ...extraQueries];

  function toggleQuery(q: string) {
    setSelectedQueries((prev) =>
      prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q]
    );
  }

  function addCustomQuery() {
    const trimmed = customQuery.trim();
    if (!trimmed) return;
    setExtraQueries((prev) => [...prev, trimmed]);
    setSelectedQueries((prev) => [...prev, trimmed]);
    setCustomQuery("");
  }

  async function checkVisibility() {
    if (selectedQueries.length === 0) return;
    setCheckLoading(true);
    setResults([]);
    try {
      const res = await fetch("/api/admin/visibility/check", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
        body: JSON.stringify({ domain: "genessa.ai", queries: selectedQueries }),
      });
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setCheckLoading(false);
    }
  }

  async function analyzeCompetitors() {
    setCompLoading(true);
    setCompetitors([]);
    try {
      const res = await fetch("/api/admin/visibility/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setCompetitors(data.competitors ?? []);
    } finally {
      setCompLoading(false);
    }
  }

  const mentionCount = results.filter((r) => r.mentioned).length;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <PageHeader
        title="CEO AI Visibility Dashboard"
        description="How is Genessa seen by AI systems?"
      />

      {/* Section 1 — AI Mention Tracker */}
      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-800)", margin: 0 }}>AI Mention Tracker</h2>

        <Panel>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Queries to check</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {allQueries.map((q) => (
              <label key={q} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={selectedQueries.includes(q)}
                  onChange={() => toggleQuery(q)}
                  style={{ width: 15, height: 15, cursor: "pointer" }}
                />
                <span style={{ fontSize: 13, color: "var(--ink-700)" }}>{q}</span>
              </label>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addCustomQuery(); }}
              placeholder="Add custom query..."
              style={{ flex: 1, padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink-800)", fontSize: 13 }}
            />
            <button
              onClick={addCustomQuery}
              disabled={!customQuery.trim()}
              style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--ink-0)", color: "var(--ink-700)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Add
            </button>
          </div>

          <button
            onClick={checkVisibility}
            disabled={checkLoading || selectedQueries.length === 0}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "var(--ink-800)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: (checkLoading || selectedQueries.length === 0) ? "not-allowed" : "pointer", opacity: (checkLoading || selectedQueries.length === 0) ? 0.6 : 1 }}
          >
            {checkLoading ? "Asking AI systems..." : "Check AI Visibility"}
          </button>
        </Panel>

        {results.length > 0 && (
          <Panel padding="p-0">
            <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-800)" }}>
                Genessa mentioned in <span style={{ color: mentionCount > 0 ? "#10B981" : "#EF4444" }}>{mentionCount}/{results.length}</span> queries
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Query", "Mentioned?", "Excerpt", "Sentiment"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => {
                    const sent = sentimentLabel[r.sentiment];
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "10px 14px", color: "var(--ink-700)", maxWidth: 220 }}>{r.query}</td>
                        <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                          {r.mentioned
                            ? <span style={{ color: "#10B981", fontWeight: 600 }}>✅ Yes</span>
                            : <span style={{ color: "#9CA3AF" }}>❌ No</span>}
                        </td>
                        <td style={{ padding: "10px 14px", color: "var(--ink-500)", maxWidth: 280, fontSize: 12 }}>{r.excerpt.slice(0, 100)}{r.excerpt.length > 100 ? "…" : ""}</td>
                        <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: sent.color }}>
                            {sent.icon} {sent.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </section>

      {/* Section 2 — Competitor Intelligence */}
      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-800)", margin: 0 }}>Competitor Intelligence</h2>

        <div>
          <button
            onClick={analyzeCompetitors}
            disabled={compLoading}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "var(--ink-800)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: compLoading ? "not-allowed" : "pointer", opacity: compLoading ? 0.6 : 1 }}
          >
            {compLoading ? "Researching competitors..." : "Analyze Competitors"}
          </button>
        </div>

        {competitors.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {competitors.map((c) => (
              <Panel key={c.name}>
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-800)", margin: "0 0 2px" }}>{c.name}</p>
                  <p style={{ fontSize: 11, color: "var(--ink-400)", margin: 0 }}>{c.website}</p>
                </div>
                <p style={{ fontSize: 13, color: "var(--ink-600)", lineHeight: 1.5, marginBottom: 12 }}>{c.proposition}</p>

                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>Strengths</p>
                  {c.strengths.map((s, i) => (
                    <p key={i} style={{ fontSize: 12, color: "var(--ink-600)", margin: "2px 0" }}>• {s}</p>
                  ))}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>Weaknesses</p>
                  {c.weaknesses.map((w, i) => (
                    <p key={i} style={{ fontSize: 12, color: "var(--ink-600)", margin: "2px 0" }}>• {w}</p>
                  ))}
                </div>

                <div style={{ padding: "10px 12px", borderRadius: 8, background: "#10B98110", border: "1px solid #10B98130" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#059669", marginBottom: 4 }}>💚 Genessa&apos;s Edge</p>
                  <p style={{ fontSize: 13, color: "#065F46", lineHeight: 1.5, margin: 0 }}>{c.genessa_advantage}</p>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
