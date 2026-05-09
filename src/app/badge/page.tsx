"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useState } from "react";

function EmbedBadge({ url, score, dark = false, tier }: { url: string; score: number; dark?: boolean; tier: string }) {
  const isVerified = tier !== "scored";
  const grad = isVerified ? ["#4B7BFF", "#A77BFF"] : ["#9A9AA6", "#6B6B75"];
  const gid = `bg-${tier}-${dark}`;
  const verb = isVerified ? "AI verified" : "AI scored";
  return (
    <span className="inline-flex items-center gap-2 flex-wrap justify-center">
      <span className="inline-flex items-center gap-2 md:gap-2.5 px-3 md:px-4 py-2 md:py-2.5 rounded-full text-[12px] md:text-sm font-medium whitespace-nowrap" style={{
        background: dark ? "#0B0B11" : "#fff", color: dark ? "#fff" : "#1A1A22",
        fontFamily: "var(--font-geist-sans)",
        boxShadow: dark ? "0 8px 24px rgba(0,0,0,0.4)" : "0 1px 2px rgba(11,11,17,0.06), 0 0 0 1px rgba(11,11,17,0.06)",
      }}>
        <svg width={16} height={16} viewBox="0 0 16 16">
          <defs><linearGradient id={gid} x1="0" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor={grad[0]} /><stop offset="1" stopColor={grad[1]} /></linearGradient></defs>
          <g stroke={`url(#${gid})`} strokeWidth="1" strokeLinecap="round"><line x1="8" y1="8" x2="3" y2="3" /><line x1="8" y1="8" x2="13" y2="3" /><line x1="8" y1="8" x2="3" y2="13" /><line x1="8" y1="8" x2="13" y2="13" /></g>
          <g fill={`url(#${gid})`}><circle cx="3" cy="3" r="1.2" /><circle cx="13" cy="3" r="1.2" /><circle cx="3" cy="13" r="1.2" /><circle cx="13" cy="13" r="1.2" /></g>
          <circle cx="8" cy="8" r="2.4" fill={`url(#${gid})`} />
        </svg>
        {verb} <span style={{ opacity: 0.4 }}>·</span> Genessa <span style={{ opacity: 0.4 }}>·</span>
        <span style={isVerified
          ? { fontFamily: "var(--font-geist-mono)", fontWeight: 600, background: "var(--genessa-gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
          : { fontFamily: "var(--font-geist-mono)", fontWeight: 600, color: dark ? "#A8A8B3" : "#71717D" }
        }>{score}/100</span>
      </span>
      {tier === "featured" && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] md:text-xs font-semibold uppercase tracking-wide text-white" style={{ background: "var(--genessa-gradient)" }}>Featured</span>
      )}
    </span>
  );
}

function BadgePageContent() {
  const searchParams = useSearchParams();
  const url = (searchParams.get("url") || "acme.com").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const score = parseInt(searchParams.get("score") || "82", 10);
  const tier = score >= 90 ? "featured" : score >= 80 ? "verified" : "scored";
  const tierLabel = tier === "featured" ? "Featured" : tier === "verified" ? "Verified" : "Scored";

  const embedCode = `<a href="https://genessa.io/score?url=${url}" target="_blank">\n  <img src="https://genessa.io/api/badge/${url}" alt="AI verified · ${score}/100" />\n</a>`;
  const [copied, setCopied] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--fg)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-3 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 no-underline text-[var(--fg)] font-semibold text-lg tracking-[-0.02em]">
            <Logo size={26} label={false} /><span>Genessa</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 w-full max-w-[1080px] mx-auto px-4 md:px-6 py-6 md:py-8 pb-16">
        <div className="mb-4">
          <Link href={`/score?url=${encodeURIComponent(url)}`} className="text-[13px] text-[var(--fg-2)] no-underline">← Back to score</Link>
        </div>
        <h1 className="text-2xl md:text-4xl font-semibold tracking-[-0.03em] mb-2">
          Your badge — <span className="gradient-text">{tierLabel}</span> tier
        </h1>
        <p className="text-sm md:text-base text-[var(--fg-2)] mb-6 md:mb-7 max-w-[580px]">
          Three tiers, one mission: a signal AI bots can read. Drop yours on your homepage, footer, or about page.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 md:mb-7">
          {[
            { name: "Scored", range: "0–79", t: "scored", s: 67, desc: "Everyone gets one. Neutral grey pill. Shows you're measured." },
            { name: "Verified", range: "80–89", t: "verified", s: 82, desc: "Blue tier. Auto-listed in the Verified Directory.", highlight: true },
            { name: "Featured", range: "90+", t: "featured", s: 95, desc: "Top placement in the directory. Same blue badge, plus a Featured chip." },
          ].map((item) => (
            <div key={item.name} className="flex flex-col gap-3.5 p-4 md:p-5 rounded-[14px]" style={{
              background: "var(--bg)",
              border: `1px solid ${item.highlight ? "var(--genessa-blue)" : "var(--border)"}`,
              boxShadow: item.highlight ? "var(--shadow-glow)" : "var(--shadow-sm)",
            }}>
              <div className="flex items-center justify-between text-base font-semibold tracking-[-0.01em]">
                {item.name}
                <span className="text-[11px] text-[var(--fg-3)] px-2 py-0.5 rounded-full bg-[var(--bg-muted)]" style={{ fontFamily: "var(--font-geist-mono)" }}>{item.range}</span>
              </div>
              <div className="flex items-center justify-center p-5 md:p-7 rounded-[14px] bg-[var(--bg-subtle)] min-h-[70px] md:min-h-[90px] overflow-x-auto">
                <EmbedBadge url={url} score={item.s} tier={item.t} />
              </div>
              <div className="text-[13px] text-[var(--fg-2)] leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 md:mb-7">
          <div className="flex items-center justify-center p-6 md:p-7 rounded-[14px] bg-white border border-[var(--border)] min-h-[70px] overflow-x-auto">
            <EmbedBadge url={url} score={score} tier={tier} />
          </div>
          <div className="flex items-center justify-center p-6 md:p-7 rounded-[14px] min-h-[70px] overflow-x-auto" style={{ background: "#0B0B11" }}>
            <EmbedBadge url={url} score={score} tier={tier} dark />
          </div>
        </div>

        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-subtle)]">
            <div className="eyebrow">Embed code</div>
            <button onClick={() => { navigator.clipboard?.writeText(embedCode); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
              className="text-xs font-medium px-2.5 py-1 rounded-[7px] border border-[var(--border-strong)] bg-[var(--bg)] text-[var(--fg)] cursor-pointer"
              style={{ fontFamily: "var(--font-geist-sans)" }}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <pre className="m-0 p-4 text-[13px] text-[var(--fg)] leading-relaxed whitespace-pre-wrap break-all" style={{ fontFamily: "var(--font-geist-mono)" }}>{embedCode}</pre>
        </div>
      </main>
    </div>
  );
}

export default function BadgePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-[var(--fg-2)]">Loading…</div>}>
      <BadgePageContent />
    </Suspense>
  );
}
