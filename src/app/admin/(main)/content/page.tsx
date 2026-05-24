"use client";

import { useState } from "react";
import { Panel } from "@/components/admin/ui/panel";
import { PageHeader } from "@/components/admin/ui/page-header";

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

const PLATFORMS = ["LinkedIn", "Twitter", "Instagram"];

type Tab = "blog" | "casestudy" | "social";

const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, border: "1px solid var(--border)", background: "var(--ink-0)", color: "var(--ink-600)", cursor: "pointer" }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function ContentPage() {
  const [tab, setTab] = useState<Tab>("blog");
  const [sector, setSector] = useState("restaurant");
  const [platform, setPlatform] = useState("LinkedIn");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);

  const [blogTitles, setBlogTitles] = useState<string[]>([]);
  const [caseStudy, setCaseStudy] = useState("");
  const [socialPosts, setSocialPosts] = useState<string[]>([]);

  async function generate() {
    setLoading(true);
    try {
      if (tab === "blog") {
        const res = await fetch("/api/admin/content/blog-ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
          body: JSON.stringify({ sector }),
        });
        const data = await res.json();
        setBlogTitles(data.titles ?? []);
      } else if (tab === "casestudy") {
        const res = await fetch("/api/admin/content/case-study", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
          body: JSON.stringify({ domain, sector }),
        });
        const data = await res.json();
        setCaseStudy(data.content ?? "");
      } else {
        const res = await fetch("/api/admin/content/social", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-secret": adminSecret },
          body: JSON.stringify({ sector, platform }),
        });
        const data = await res.json();
        setSocialPosts(data.posts ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "blog", label: "Blog Ideas" },
    { key: "casestudy", label: "Case Study" },
    { key: "social", label: "Social Media" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader title="Content" description="Generate AI-powered content for Genessa marketing." />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
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

      <Panel>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Sector select — always shown */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Sector</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--ink-0)", color: "var(--ink-800)", fontSize: 13, width: "100%", maxWidth: 260 }}
            >
              {SECTORS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>

          {/* Platform — social only */}
          {tab === "social" && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--ink-0)", color: "var(--ink-800)", fontSize: 13, width: "100%", maxWidth: 260 }}
              >
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}

          {/* Domain — case study only */}
          {tab === "casestudy" && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--ink-600)", marginBottom: 4 }}>Domain</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--ink-0)", color: "var(--ink-800)", fontSize: 13, width: "100%", maxWidth: 260 }}
              />
            </div>
          )}

          <button
            onClick={generate}
            disabled={loading}
            style={{ alignSelf: "flex-start", padding: "8px 18px", borderRadius: 8, border: "none", background: "var(--ink-800)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </Panel>

      {/* Blog results */}
      {tab === "blog" && blogTitles.length > 0 && (
        <Panel>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Blog Post Titles</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {blogTitles.map((title, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)" }}>
                <span style={{ fontSize: 14, color: "var(--ink-800)" }}>{title}</span>
                <CopyButton text={title} />
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Case study results */}
      {tab === "casestudy" && caseStudy && (
        <Panel>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Case Study Outline</p>
            <CopyButton text={caseStudy} />
          </div>
          <textarea
            readOnly
            value={caseStudy}
            style={{ width: "100%", minHeight: 320, padding: 12, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink-800)", fontSize: 13, lineHeight: 1.7, resize: "vertical", fontFamily: "inherit" }}
          />
        </Panel>
      )}

      {/* Social results */}
      {tab === "social" && socialPosts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {socialPosts.map((post, i) => (
            <Panel key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Post {i + 1}</span>
                <CopyButton text={post} />
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-800)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{post}</p>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
