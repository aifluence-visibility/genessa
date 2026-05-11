"use client";

import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { useState } from "react";

const faqs = [
  {
    q: "What is an AI visibility score?",
    a: "Your AI visibility score (0–100) measures how well AI engines like ChatGPT, Perplexity, and Claude can find, read, and cite your website.",
  },
  {
    q: "Why does my AI visibility score matter?",
    a: "Over 40% of searches now happen through AI. If AI can’t read your site, you’re invisible to this growing audience.",
  },
  {
    q: "What does Genessa check?",
    a: "9 checks: Schema.org structured data, llms.txt, Robots.txt AI permissions, Open Graph tags, Entity links, H1/H2 structure, content freshness, page speed, and answer-first content.",
  },
  {
    q: "How do I get the badge?",
    a: "Score 35 or above and click “Get free badge” on your results page.",
  },
  {
    q: "How often should I scan my site?",
    a: "Monthly is ideal. AI engines update their crawling behavior frequently.",
  },
  {
    q: "What is llms.txt?",
    a: "A simple file at yoursite.com/llms.txt that tells AI bots what your site is about — like a robots.txt but for AI.",
  },
  {
    q: "How is this different from SEO?",
    a: "Traditional SEO optimizes for Google’s algorithm. AI visibility optimizes for how ChatGPT, Perplexity and Claude understand and cite your content.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--border)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
        style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-geist-sans)" }}
      >
        <span className="text-[15px] md:text-base font-semibold tracking-[-0.01em] text-[var(--fg)]">{q}</span>
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="2" strokeLinecap="round"
          className="shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      {open && (
        <div className="pb-5 text-sm md:text-[15px] text-[var(--fg-2)] leading-relaxed" style={{ maxWidth: 600 }}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <>
      <Nav />
      <main className="w-full max-w-[880px] mx-auto px-4 md:px-8" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <div className="relative text-center overflow-hidden" style={{ marginBottom: 48 }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(50% 60% at 50% 30%, rgba(75,123,255,0.14) 0%, rgba(123,63,228,0) 70%)" }} />
          <div className="relative">
            <div className="eyebrow" style={{ marginBottom: 16 }}>FAQ</div>
            <h1 className="text-3xl md:text-[56px]" style={{ fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.05, margin: "0 0 14px" }}>
              Frequently asked <em className="serif-italic gradient-text" style={{ paddingRight: 4 }}>questions</em>
            </h1>
            <p className="text-sm md:text-[17px]" style={{ color: "var(--fg-2)", maxWidth: 480, margin: "0 auto" }}>
              Everything you need to know about AI visibility and how Genessa works.
            </p>
          </div>
        </div>

        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-[var(--shadow-sm)]">
          <div className="px-5 md:px-8">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
