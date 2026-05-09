"use client";

import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { GradientGlyph } from "@/components/Glyphs";
import { useState, useEffect } from "react";

function HeroSimple({ eyebrow, title, accent, sub }: { eyebrow?: string; title: string; accent?: string; sub?: string }) {
  return (
    <section className="relative text-center px-4 md:px-8 pt-12 md:pt-16 pb-6 md:pb-8" style={{ maxWidth: 880, margin: "0 auto" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(60% 60% at 50% 30%, rgba(75,123,255,0.14) 0%, rgba(123,63,228,0) 70%)" }} />
      <div className="relative">
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 20 }}>{eyebrow}</div>}
        <h1 style={{ fontSize: "clamp(40px, 6vw, 64px)", fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.05, margin: "0 0 16px" }}>
          {title}{accent && <> <em className="serif-italic gradient-text" style={{ paddingRight: 4 }}>{accent}</em></>}
        </h1>
        {sub && <p className="text-base md:text-lg" style={{ color: "var(--fg-2)", lineHeight: 1.5, maxWidth: 560, margin: "0 auto" }}>{sub}</p>}
      </div>
    </section>
  );
}

function ChecklistCard({ kind, title, items }: { kind: "old" | "new"; title: string; items: string[] }) {
  const isNew = kind === "new";
  return (
    <div className="relative overflow-hidden flex flex-col gap-4" style={{
      background: "var(--bg)", border: `1px solid ${isNew ? "var(--genessa-blue)" : "var(--border)"}`,
      borderRadius: 16, padding: 24, boxShadow: isNew ? "var(--shadow-glow)" : "var(--shadow-sm)",
    }}>
      {isNew && <div className="absolute top-0 right-0" style={{ padding: "4px 12px", borderBottomLeftRadius: 10, background: "var(--genessa-gradient)", color: "#fff", fontFamily: "var(--font-geist-mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>New world</div>}
      <div className="eyebrow" style={{ color: isNew ? "var(--genessa-blue)" : "var(--fg-3)" }}>{isNew ? "AI engines" : "Old world · Google"}</div>
      <h3 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" }}>{title}</h3>
      <ul className="flex flex-col gap-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2.5" style={{ fontSize: 15, color: "var(--fg-2)", fontFamily: "var(--font-geist-mono)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isNew ? "url(#cig)" : "var(--fg-3)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs><linearGradient id="cig" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#2952E3" /><stop offset="1" stopColor="#7B3FE4" /></linearGradient></defs>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function VideoPlaceholder() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => (p + 1) % 3), 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col gap-4 items-center" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 16, padding: 32, boxShadow: "var(--shadow-sm)" }}>
      <div className="eyebrow" style={{ color: "var(--fg-3)" }}>See it in action</div>
      <div className="relative overflow-hidden flex items-center justify-center" style={{ width: "100%", maxWidth: 560, height: 220, borderRadius: 14, background: "var(--bg-subtle)", border: "1px solid var(--border)", padding: 20 }}>
        {phase === 0 && (
          <div className="flex overflow-hidden" style={{ border: "1px solid var(--genessa-blue)", borderRadius: 12, boxShadow: "var(--shadow-glow)", background: "var(--bg)" }}>
            <div className="flex items-center gap-2" style={{ padding: "12px 16px", fontFamily: "var(--font-geist-mono)", fontSize: 14, color: "var(--fg-2)" }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--score-good)" }} />https://acme.com
            </div>
            <div style={{ background: "var(--genessa-gradient)", color: "#fff", padding: "12px 18px", fontSize: 13, fontWeight: 500 }}>Get free score</div>
          </div>
        )}
        {phase === 1 && (
          <div className="flex flex-col items-center gap-3">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="24" stroke="var(--border)" strokeWidth="4" fill="none" />
              <circle cx="32" cy="32" r="24" stroke="url(#scang2)" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="38 150" style={{ animation: "spin 900ms linear infinite", transformOrigin: "center" }} />
              <defs><linearGradient id="scang2" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#2952E3" /><stop offset="1" stopColor="#7B3FE4" /></linearGradient></defs>
            </svg>
            <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13, color: "var(--fg-2)" }}>Scanning 142 URLs…</div>
          </div>
        )}
        {phase === 2 && (
          <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 80, fontWeight: 500, letterSpacing: "-0.04em", background: "var(--genessa-gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>82</div>
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: 99, background: phase === i ? "var(--genessa-blue)" : "var(--border-strong)", transition: "all 300ms" }} />)}
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const steps = [
    { title: "Enter your URL", body: "Drop in a domain. We crawl up to 200 URLs in 30 seconds — no signup needed.", glyph: <GradientGlyph d="M3 12h18M12 3v18" /> },
    { title: "Get your score", body: "A weighted 0–100 number across 5 protocols. Pass / partial / missing for each check.", glyph: <GradientGlyph d="M12 2a10 10 0 1 0 10 10M12 2v10l7 7" /> },
    { title: "Get the badge", body: "Embed a pill that links to your live score. AI bots read it. Visitors mostly don't.", glyph: <GradientGlyph d="M12 2 4 5v6c0 5 3 9 8 11 5-2 8-6 8-11V5l-8-3zM9 12l2 2 4-4" /> },
  ];

  return (
    <>
      <Nav />
      <main style={{ paddingBottom: 64 }}>
        <HeroSimple eyebrow="How it works" title="AI is searching. Can it" accent="see you?" sub="Genessa scores your website against the protocols that AI engines actually read. Two minutes from URL to badge." />
        <section className="px-4 md:px-8" style={{ maxWidth: 1080, margin: "0 auto", paddingTop: 32 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChecklistCard kind="old" title="Old world — Google" items={["SSL certificate", "Sitemap.xml", "Robots.txt", "Page speed"]} />
            <ChecklistCard kind="new" title="New world — AI engines" items={["Schema.org markup", "llms.txt manifest", "Entity links", "Answer-first content"]} />
          </div>
        </section>
        <section className="px-4 md:px-8" style={{ maxWidth: 1080, margin: "0 auto", paddingTop: 48 }}>
          <div className="eyebrow mb-4">Three steps · 60 seconds</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-col gap-3" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 99, background: "var(--genessa-gradient)", color: "#fff", fontFamily: "var(--font-geist-mono)", fontSize: 13, fontWeight: 600 }}>{i + 1}</span>
                  <div className="inline-flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: "var(--genessa-gradient-soft)" }}>{s.glyph}</div>
                </div>
                <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>{s.title}</div>
                <div style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.55 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="px-4 md:px-8" style={{ maxWidth: 1080, margin: "0 auto", paddingTop: 48 }}>
          <VideoPlaceholder />
        </section>
        <section className="px-4 md:px-8" style={{ maxWidth: 880, margin: "0 auto", paddingTop: 48 }}>
          <blockquote className="flex flex-col gap-3.5" style={{ margin: 0, padding: "24px 20px", borderRadius: 16, background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
            <div className="text-xl md:text-[28px]" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", lineHeight: 1.3, color: "var(--fg)", letterSpacing: "-0.01em" }}>&ldquo;A Genessa badge is the next-gen SSL certificate. Not for visitors. For AI bots.&rdquo;</div>
            <div style={{ fontSize: 13, color: "var(--fg-3)", fontFamily: "var(--font-geist-mono)" }}>— The Genessa thesis</div>
          </blockquote>
        </section>
      </main>
      <Footer />
    </>
  );
}
