"use client";

import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import Link from "next/link";

const WA_NUMBER = "905325788737";
const WA_MSG = encodeURIComponent(
  "Hi! I'd like to get started with Genessa's AI Visibility Tour ($49 early access). Could you help me set it up?"
);
const WA_HREF = `https://wa.me/${WA_NUMBER}?text=${WA_MSG}`;

function Check() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="url(#cg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2952E3" />
          <stop offset="1" stopColor="#7B3FE4" />
        </linearGradient>
      </defs>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: "#DCFCE7", color: "#15803D", letterSpacing: "0.02em",
    }}>
      {children}
    </span>
  );
}

const FEATURES = [
  "Up to 15 AI visibility prompts",
  "3 engines: Claude, GPT-4o, Perplexity",
  "3× repeats per prompt per engine for reliability",
  "Citation rate, share of voice, source links",
  "Sentiment breakdown (positive / neutral / negative)",
  "Competitor tracking included",
  "en-US and tr-TR locale support",
  "Weekly history dashboard",
  "Credits added to your account within 24h",
];

const FAQ = [
  {
    q: "What exactly is a tour?",
    a: "A tour runs all your approved prompts through Claude, GPT-4o, and Perplexity — each repeated 3 times for statistical reliability. Results are aggregated into citation rates, share of voice, and sentiment scores.",
  },
  {
    q: "How do I buy?",
    a: "Send us a WhatsApp message and we'll set everything up manually. Credits are added to your account within 24 hours of payment.",
  },
  {
    q: "Is there a subscription or auto-renewal?",
    a: "No. Every purchase is one-time and manual. You buy when you need it, we run it, that's it.",
  },
  {
    q: "When does the early-access price end?",
    a: "The $49 price is locked for the first 50 customers. After that it moves to $79–99. If you're reading this, you're early.",
  },
  {
    q: "Can I buy multiple tours?",
    a: "Yes. Each purchase adds a credit to your account. Credits stack — run them whenever you want: weekly, monthly, or before a big campaign.",
  },
  {
    q: "What if I'm not happy with the results?",
    a: "We'll work with you. If something looks off or the prompts aren't capturing your brand correctly, message us and we'll fix it.",
  },
];

export default function Pricing() {
  return (
    <>
      <Nav />
      <main className="w-full max-w-[1200px] mx-auto px-4 md:px-8 overflow-hidden" style={{ paddingTop: 64, paddingBottom: 100 }}>

        {/* Hero */}
        <div className="relative text-center" style={{ marginBottom: 72 }}>
          <div className="absolute pointer-events-none" style={{
            inset: -20,
            background: "radial-gradient(50% 60% at 50% 30%, rgba(75,123,255,0.13) 0%, rgba(123,63,228,0) 70%)",
          }} />
          <div className="relative">
            <div className="eyebrow" style={{ marginBottom: 16 }}>Pricing</div>
            <h1 className="text-3xl md:text-[56px]" style={{
              fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.05, margin: "0 0 16px",
            }}>
              One price.{" "}
              <em className="serif-italic gradient-text" style={{ paddingRight: 4 }}>No surprises.</em>
            </h1>
            <p className="text-sm md:text-[17px]" style={{
              color: "var(--fg-2)", maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.6,
            }}>
              Genessa is a one-time purchase product.
              No subscription, no renewal, no lock-in.
              Buy a tour, get your data, decide what&apos;s next.
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              <Pill>No subscription</Pill>
              <Pill>One-time purchase</Pill>
              <Pill>Credits added within 24h</Pill>
            </div>
          </div>
        </div>

        {/* Main card */}
        <div className="max-w-[560px] mx-auto" style={{ marginBottom: 80 }}>
          <div style={{
            position: "relative",
            borderRadius: 22,
            background: "linear-gradient(var(--bg),var(--bg)) padding-box, var(--genessa-gradient) border-box",
            border: "2px solid transparent",
            boxShadow: "var(--shadow-glow), 0 24px 60px rgba(41,82,227,0.08)",
            padding: "40px 40px 36px",
          }}>
            {/* Early access badge */}
            <div style={{
              position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
              padding: "4px 14px", borderRadius: 99,
              background: "var(--genessa-gradient)", color: "#fff",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(41,82,227,0.35)",
            }}>
              Early Access · First 50 customers
            </div>

            {/* Brand */}
            <div style={{
              fontSize: 11, fontWeight: 700, color: "var(--fg-3)",
              textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20,
              fontFamily: "var(--font-geist-mono)",
            }}>
              Genessa by NurdAI
            </div>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 6 }}>
              <span style={{
                fontSize: 72, fontWeight: 600, letterSpacing: "-0.05em",
                lineHeight: 1, color: "var(--fg)",
              }}>
                $49
              </span>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: "var(--fg-3)", textDecoration: "line-through", fontFamily: "var(--font-geist-mono)" }}>
                  $79–99
                </div>
                <div style={{ fontSize: 12, color: "var(--fg-3)" }}>one-time</div>
              </div>
            </div>

            <p style={{ fontSize: 14, color: "var(--fg-2)", margin: "0 0 28px", lineHeight: 1.55 }}>
              One AI Visibility Tour — runs your prompts across all three engines and delivers a full breakdown of where your brand stands in AI search results.
            </p>

            {/* Features */}
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 11 }}>
              {FEATURES.map((f) => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--fg)" }}>
                  <Check />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "16px 28px", borderRadius: 12,
                background: "var(--genessa-gradient)",
                color: "#fff", fontSize: 15, fontWeight: 600,
                textDecoration: "none",
                boxShadow: "var(--shadow-glow), 0 4px 16px rgba(41,82,227,0.3)",
                transition: "opacity 150ms",
              }}
            >
              {/* WhatsApp icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Buy via WhatsApp · $49
            </a>

            <p style={{ textAlign: "center", fontSize: 12, color: "var(--fg-3)", marginTop: 14, lineHeight: 1.5 }}>
              No subscription · No auto-renewal · Credits added within 24h
            </p>
          </div>
        </div>

        {/* How it works strip */}
        <div style={{ marginBottom: 80 }}>
          <h2 style={{
            textAlign: "center", fontSize: 22, fontWeight: 600,
            letterSpacing: "-0.03em", margin: "0 0 36px",
          }}>
            How a tour works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: "01", title: "Onboard", body: "Enter your domain. We generate AI visibility prompts tailored to your sector and competitors." },
              { step: "02", title: "Purchase", body: "Buy a tour via WhatsApp. One-time payment, credits added to your account within 24h." },
              { step: "03", title: "Run", body: "We execute your prompts across Claude, GPT-4o, and Perplexity — 3× each for reliability." },
              { step: "04", title: "Analyse", body: "View citation rate, share of voice, sentiment, and trend over time in your dashboard." },
            ].map((s) => (
              <div key={s.step} style={{
                padding: "22px 22px 22px 24px", borderRadius: 14,
                background: "var(--bg-subtle)", border: "1px solid var(--border)",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", right: 14, top: 14,
                  fontSize: 36, fontWeight: 700, letterSpacing: "-0.04em",
                  color: "var(--border)", fontFamily: "var(--font-geist-mono)",
                  lineHeight: 1,
                }}>
                  {s.step}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, letterSpacing: "-0.01em", color: "var(--fg)" }}>
                  {s.title}
                </div>
                <p style={{ fontSize: 13, color: "var(--fg-2)", margin: 0, lineHeight: 1.55 }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 720, margin: "0 auto 80px" }}>
          <h2 style={{
            textAlign: "center", fontSize: 22, fontWeight: 600,
            letterSpacing: "-0.03em", margin: "0 0 36px",
          }}>
            Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {FAQ.map((item, i) => (
              <div key={i} style={{
                padding: "20px 24px",
                borderRadius: i === 0 ? "12px 12px 0 0" : i === FAQ.length - 1 ? "0 0 12px 12px" : 0,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderTop: i > 0 ? "none" : "1px solid var(--border)",
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 6, letterSpacing: "-0.01em" }}>
                  {item.q}
                </div>
                <p style={{ fontSize: 13, color: "var(--fg-2)", margin: 0, lineHeight: 1.6 }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div style={{
          textAlign: "center", padding: "48px 24px", borderRadius: 20,
          background: "linear-gradient(135deg, rgba(41,82,227,0.06), rgba(123,63,228,0.06))",
          border: "1px solid rgba(41,82,227,0.15)",
          marginBottom: 20,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--fg-3)", marginBottom: 16, fontFamily: "var(--font-geist-mono)",
          }}>
            Genessa by NurdAI
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.03em", margin: "0 0 12px", color: "var(--fg)" }}>
            See where you stand in AI search — today.
          </h2>
          <p style={{ fontSize: 14, color: "var(--fg-2)", maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.6 }}>
            First 50 customers get the tour at $49. After that, price increases. No card stored, no auto-charge.
          </p>
          <a
            href={WA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 9,
              padding: "14px 28px", borderRadius: 12,
              background: "var(--genessa-gradient)",
              color: "#fff", fontSize: 15, fontWeight: 600,
              textDecoration: "none",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Start on WhatsApp →
          </a>
          <p style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 14 }}>
            Or{" "}
            <Link href="/onboarding" style={{ color: "var(--genessa-blue)", textDecoration: "none", fontWeight: 500 }}>
              create your free account first
            </Link>
            {" "}— then buy when you&apos;re ready.
          </p>
        </div>

      </main>
      <Footer />
    </>
  );
}
