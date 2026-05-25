"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function tierVerb(tier: string): string {
  if (tier === "featured") return "AI Trusted";
  if (tier === "verified") return "AI Verified";
  return "AI Scored";
}

function EmbedBadge({ score, dark = false, tier }: { score: number; dark?: boolean; tier: string }) {
  const isVerified = tier !== "scored";
  const grad = isVerified ? ["#4B7BFF", "#A77BFF"] : ["#9A9AA6", "#6B6B75"];
  const gid = `bg-${tier}-${dark ? "d" : "l"}`;
  const verb = tierVerb(tier);
  void score;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const, justifyContent: "center" }}>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "8px 14px", borderRadius: 999,
        fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" as const,
        background: dark ? "#0B0B11" : "#fff", color: dark ? "#fff" : "#1A1A22",
        fontFamily: "var(--font-geist-sans)",
        boxShadow: dark ? "0 8px 24px rgba(0,0,0,0.4)" : "0 1px 2px rgba(11,11,17,0.06), 0 0 0 1px rgba(11,11,17,0.06)",
      }}>
        <svg width={16} height={16} viewBox="0 0 16 16">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={grad[0]} /><stop offset="1" stopColor={grad[1]} />
            </linearGradient>
          </defs>
          <g stroke={`url(#${gid})`} strokeWidth="1" strokeLinecap="round">
            <line x1="8" y1="8" x2="3" y2="3" /><line x1="8" y1="8" x2="13" y2="3" />
            <line x1="8" y1="8" x2="3" y2="13" /><line x1="8" y1="8" x2="13" y2="13" />
          </g>
          <g fill={`url(#${gid})`}>
            <circle cx="3" cy="3" r="1.2" /><circle cx="13" cy="3" r="1.2" />
            <circle cx="3" cy="13" r="1.2" /><circle cx="13" cy="13" r="1.2" />
          </g>
          <circle cx="8" cy="8" r="2.4" fill={`url(#${gid})`} />
        </svg>
        {verb} <span style={{ opacity: 0.4 }}>·</span> Genessa
      </span>
      {tier === "featured" && (
        <span style={{
          display: "inline-flex", alignItems: "center",
          padding: "4px 10px", borderRadius: 999,
          fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const,
          color: "#fff", background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
        }}>
          Featured
        </span>
      )}
    </span>
  );
}

function BadgePageContent() {
  const searchParams = useSearchParams();
  const url = (searchParams.get("url") || "acme.com").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const score = parseInt(searchParams.get("score") || "82", 10);
  const tier = score >= 90 ? "featured" : score >= 80 ? "verified" : "scored";
  const tierLabel = tier === "featured" ? "AI Trusted" : tier === "verified" ? "AI Verified" : "AI Scored";
  const embedCode = `<a href="https://genessa.io/score?url=${url}" target="_blank">\n  <img src="https://genessa.io/api/badge/${url}" alt="${tierLabel} · Genessa" />\n</a>`;
  const [copied, setCopied] = useState(false);

  return (
    <div style={{ padding: "36px 40px 80px", color: "#111827" }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/dashboard" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none" }}>
          ← Back to dashboard
        </Link>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 6px" }}>
          🏅 My Badge —{" "}
          <span style={{
            background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
            WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
          }}>
            {tierLabel}
          </span>{" "}
          tier
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: 0, maxWidth: 560 }}>
          Three tiers, one mission: a signal AI bots can read. Drop yours on your homepage, footer, or about page.
        </p>
      </div>

      {/* Tier comparison */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { name: "Scored", range: "0–79", t: "scored", s: 67, desc: "Everyone gets one. Neutral grey pill. Shows you're measured." },
          { name: "Verified", range: "80–89", t: "verified", s: 82, desc: "Blue tier. Auto-listed in the Verified Directory.", highlight: true },
          { name: "Featured", range: "90+", t: "featured", s: 95, desc: "Top placement in the directory. Same blue badge, plus a Featured chip." },
        ].map((item) => (
          <div key={item.name} style={{
            display: "flex", flexDirection: "column", gap: 12,
            padding: "18px 20px", borderRadius: 14,
            background: "#fff",
            border: `1px solid ${item.highlight ? "#2952E3" : "#E5E7EB"}`,
            boxShadow: item.highlight ? "0 0 0 3px rgba(41,82,227,0.07)" : "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, fontWeight: 600, color: "#111827" }}>
              {item.name}
              <span style={{
                fontSize: 10, color: "#9CA3AF", padding: "2px 8px",
                borderRadius: 999, background: "#F3F4F6",
                fontFamily: "var(--font-geist-mono)",
              }}>
                {item.range}
              </span>
            </div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "20px 12px", borderRadius: 10, background: "#F8F9FC", minHeight: 72, overflow: "hidden",
            }}>
              <EmbedBadge score={item.s} tier={item.t} />
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.55 }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Light / dark preview */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24, borderRadius: 14, background: "#fff",
          border: "1px solid #E5E7EB", minHeight: 72,
        }}>
          <EmbedBadge score={score} tier={tier} />
        </div>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24, borderRadius: 14, minHeight: 72, background: "#0B0B11",
        }}>
          <EmbedBadge score={score} tier={tier} dark />
        </div>
      </div>

      {/* Embed code */}
      <div style={{ borderRadius: 14, border: "1px solid #E5E7EB", background: "#fff", overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 20px", borderBottom: "1px solid #E5E7EB", background: "#FAFAFA",
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#9CA3AF",
            textTransform: "uppercase" as const, letterSpacing: "0.08em",
          }}>
            Embed code
          </span>
          <button
            onClick={() => { navigator.clipboard?.writeText(embedCode); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
            style={{
              fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 7,
              border: "1px solid #E5E7EB", background: "#fff", color: "#374151",
              cursor: "pointer", fontFamily: "var(--font-geist-sans)",
            }}
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
        <pre style={{
          margin: 0, padding: "16px 20px", fontSize: 12, color: "#374151",
          lineHeight: 1.7, whiteSpace: "pre-wrap" as const, wordBreak: "break-all" as const,
          fontFamily: "var(--font-geist-mono)",
        }}>
          {embedCode}
        </pre>
      </div>
    </div>
  );
}

export default function DashboardBadgePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "#9CA3AF" }}>Loading…</div>}>
      <BadgePageContent />
    </Suspense>
  );
}
