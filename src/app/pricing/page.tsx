"use client";

import { useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import Link from "next/link";

function Check({ grad }: { grad?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={grad ? "url(#pcg)" : "currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <defs><linearGradient id="pcg" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#2952E3" /><stop offset="1" stopColor="#7B3FE4" /></linearGradient></defs>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Dash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
      <line x1="6" y1="12" x2="18" y2="12" />
    </svg>
  );
}

function Lock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

type Feature = { icon: string; text: string };
type PlanDef = {
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  yearlyNote: string | null;
  per: string;
  popular: boolean;
  audience: string;
  features: Feature[];
  cta: { label: string; href: string };
  ctaKind: "primary" | "secondary";
};

const plansData: PlanDef[] = [
  {
    name: "Free",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    yearlyNote: null,
    per: "/ forever",
    popular: false,
    audience: "For anyone who wants a quick AI health check.",
    features: [
      { icon: "check", text: "1 domain" },
      { icon: "check", text: "1 scan per month" },
      { icon: "check", text: "AI Readiness Score (all 9 checks)" },
      { icon: "partial", text: "AI Authority Score (number only)" },
      { icon: "lock", text: "AI Influence Score (locked)" },
      { icon: "check", text: "Hero insight" },
      { icon: "check", text: "2 of 6 insight blocks" },
      { icon: "partial", text: "Action checklist (first 3)" },
    ],
    cta: { label: "Start free", href: "/?scan=1" },
    ctaKind: "secondary",
  },
  {
    name: "Starter",
    monthlyPrice: "$29",
    yearlyPrice: "$23",
    yearlyNote: "billed $276/yr",
    per: "/ month",
    popular: true,
    audience: "For founders & marketers serious about AI visibility.",
    features: [
      { icon: "check", text: "1 domain" },
      { icon: "check", text: "2 scans per week" },
      { icon: "check", text: "AI Readiness Score (full)" },
      { icon: "check", text: "AI Authority Score (full detail)" },
      { icon: "lock", text: "AI Influence Score (locked)" },
      { icon: "check", text: "Hero insight" },
      { icon: "check", text: "All 6 insight blocks" },
      { icon: "check", text: "Full action checklist" },
      { icon: "check", text: "Scan history" },
    ],
    cta: { label: "Get started", href: "/contact" },
    ctaKind: "primary",
  },
  {
    name: "Pro",
    monthlyPrice: "$79",
    yearlyPrice: "$63",
    yearlyNote: "billed $756/yr",
    per: "/ month",
    popular: false,
    audience: "For teams and power users.",
    features: [
      { icon: "check", text: "1 domain" },
      { icon: "check", text: "4 scans per week" },
      { icon: "check", text: "Everything in Starter" },
      { icon: "check", text: "AI Influence Score (full)" },
      { icon: "check", text: "Growth Audit (multi-agent)" },
      { icon: "check", text: "PDF report export" },
    ],
    cta: { label: "Get started", href: "/contact" },
    ctaKind: "secondary",
  },
  {
    name: "Enterprise",
    monthlyPrice: "Custom",
    yearlyPrice: "Custom",
    yearlyNote: null,
    per: "pricing",
    popular: false,
    audience: "For multi-brand businesses & organizations.",
    features: [
      { icon: "check", text: "Up to 10 business entities" },
      { icon: "check", text: "Pro features per entity" },
      { icon: "check", text: "Unified agency dashboard" },
      { icon: "check", text: "Weekly report per entity" },
      { icon: "check", text: "White-label option" },
      { icon: "check", text: "Custom pricing" },
    ],
    cta: { label: "Contact us", href: "/partner" },
    ctaKind: "secondary",
  },
];

function FeatureIcon({ icon, grad }: { icon: string; grad?: boolean }) {
  if (icon === "check") return <Check grad={grad} />;
  if (icon === "dash") return <Dash />;
  if (icon === "lock") return <Lock />;
  if (icon === "partial") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--fg-2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
  return null;
}

type CellValue = string | { text: string; muted?: boolean };

const tableRows: { label: string; free: CellValue; starter: CellValue; pro: CellValue; agency: CellValue }[] = [
  { label: "Domains",              free: "1",                                   starter: "1",                               pro: "1",                           agency: "10"                             },
  { label: "Scan limit",           free: "1 per month",                         starter: "2 per week",                      pro: "4 per week",                  agency: "Unlimited"                      },
  { label: "AI Readiness Score",   free: "✓",                                   starter: "Full detail",                     pro: "Full detail",                 agency: "Full detail"                    },
  { label: "AI Authority Score",   free: { text: "Number only", muted: true },  starter: "Full detail",                     pro: "Full detail",                 agency: "Full detail"                    },
  { label: "AI Influence Score",   free: { text: "Locked", muted: true },       starter: { text: "Locked", muted: true },   pro: "✓",                           agency: "✓"                              },
  { label: "Insight blocks",       free: "2 / 6",                               starter: "6 / 6",                           pro: "6 / 6",                       agency: "6 / 6"                          },
  { label: "Action checklist",     free: "First 3",                             starter: "All items",                       pro: "All items",                   agency: "All items"                      },
  { label: "Scan history",         free: "—",                                   starter: "✓",                               pro: "✓",                           agency: "✓"                              },
  { label: "Growth Audit",         free: "—",                                   starter: "—",                               pro: "✓",                           agency: "✓"                              },
  { label: "PDF export",           free: "—",                                   starter: "—",                               pro: "✓",                           agency: "✓"                              },
  { label: "White-label",          free: "—",                                   starter: "—",                               pro: "—",                           agency: "✓"                              },
  { label: "Client dashboard",     free: "—",                                   starter: "—",                               pro: "—",                           agency: "✓"                              },
  { label: "Weekly email",         free: "—",                                   starter: "✓",                               pro: "✓",                           agency: "✓"                              },
];

function TableCell({ value, highlight }: { value: CellValue; highlight?: boolean }) {
  if (value === "—") {
    return <td className="px-5 py-4 text-center" style={{ color: "var(--fg-3)", fontFamily: "var(--font-geist-mono)", fontSize: 13 }}>—</td>;
  }
  if (value === "✓") {
    return (
      <td className="px-5 py-4 text-center">
        <span className="inline-flex justify-center">
          <Check grad={highlight} />
        </span>
      </td>
    );
  }
  if (typeof value === "object") {
    return (
      <td className="px-5 py-4 text-center text-[13px]" style={{ color: value.muted ? "var(--fg-3)" : "var(--fg)", fontFamily: "var(--font-geist-mono)" }}>
        {value.text}
      </td>
    );
  }
  return (
    <td className="px-5 py-4 text-center text-[13px]" style={{ color: highlight ? "var(--fg)" : "var(--fg-2)", fontFamily: "var(--font-geist-mono)", fontWeight: highlight ? 500 : 400 }}>
      {value}
    </td>
  );
}

export default function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <>
      <Nav />
      <main className="w-full max-w-[1200px] mx-auto px-4 md:px-8 overflow-hidden" style={{ paddingTop: 48, paddingBottom: 80 }}>

        {/* Hero */}
        <div className="relative text-center" style={{ marginBottom: 40 }}>
          <div className="absolute pointer-events-none" style={{ inset: -20, background: "radial-gradient(50% 60% at 50% 30%, rgba(75,123,255,0.14) 0%, rgba(123,63,228,0) 70%)" }} />
          <div className="relative">
            <div className="eyebrow" style={{ marginBottom: 16 }}>Pricing</div>
            <h1 className="text-3xl md:text-[56px]" style={{ fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.05, margin: "0 0 14px" }}>
              Simple, transparent <em className="serif-italic gradient-text" style={{ paddingRight: 4 }}>pricing</em>
            </h1>
            <p className="text-sm md:text-[17px]" style={{ color: "var(--fg-2)", maxWidth: 520, margin: "0 auto 28px" }}>
              Start free. Upgrade when you need more depth, more domains, or AI mention tracking.
            </p>

            {/* Billing toggle */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 10, padding: "5px 6px" }}>
              <button
                onClick={() => setBilling("monthly")}
                style={{
                  padding: "6px 16px", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "none",
                  background: billing === "monthly" ? "var(--bg)" : "transparent",
                  color: billing === "monthly" ? "var(--fg)" : "var(--fg-3)",
                  boxShadow: billing === "monthly" ? "var(--shadow-sm)" : "none",
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 16px", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "none",
                  background: billing === "yearly" ? "var(--bg)" : "transparent",
                  color: billing === "yearly" ? "var(--fg)" : "var(--fg-3)",
                  boxShadow: billing === "yearly" ? "var(--shadow-sm)" : "none",
                }}
              >
                Yearly
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 99, background: "#DCFCE7", color: "#15803D", letterSpacing: "0.04em" }}>
                  20% OFF
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 1 — Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch" style={{ marginBottom: 80 }}>
          {plansData.map((plan) => {
            const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const isCustom = price === "Custom";
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col gap-5 p-6 md:p-7 ${plan.popular ? "lg:-translate-y-2" : ""}`}
                style={{
                  borderRadius: 18,
                  background: plan.popular
                    ? "linear-gradient(var(--bg),var(--bg)) padding-box, var(--genessa-gradient) border-box"
                    : "var(--bg)",
                  border: plan.popular ? "1.5px solid transparent" : "1px solid var(--border)",
                  boxShadow: plan.popular ? "var(--shadow-glow)" : "var(--shadow-sm)",
                }}
              >
                {plan.popular && (
                  <span className="absolute" style={{
                    top: -13, left: "50%", transform: "translateX(-50%)",
                    padding: "5px 14px", borderRadius: 99,
                    background: "var(--genessa-gradient)", color: "#fff",
                    fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 600,
                    letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap",
                  }}>Most popular</span>
                )}

                <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, color: "var(--fg-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {plan.name}
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className={`leading-none font-medium tracking-[-0.04em] ${isCustom ? "text-[28px]" : "text-[48px]"} ${plan.popular ? "gradient-text" : ""}`}>
                    {price}
                  </span>
                  {plan.per && <span style={{ fontSize: 15, color: "var(--fg-3)" }}>{plan.per}</span>}
                </div>

                {billing === "yearly" && plan.yearlyNote && (
                  <p style={{ fontSize: 11, color: "var(--fg-3)", margin: "-12px 0 0", fontFamily: "var(--font-geist-mono)" }}>
                    {plan.yearlyNote}
                  </p>
                )}

                <p style={{ fontSize: 13, color: "var(--fg-3)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                  {plan.audience}
                </p>

                <ul className="flex flex-col gap-3 flex-1" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-2.5 text-[13.5px]" style={{
                      color: f.icon === "dash" || f.icon === "lock" ? "var(--fg-3)" : "var(--fg)",
                    }}>
                      <FeatureIcon icon={f.icon} grad={plan.popular} />
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.cta.href}
                  className="block text-center no-underline mt-2"
                  style={{
                    padding: "13px 20px", borderRadius: 10,
                    fontFamily: "var(--font-geist-sans)", fontSize: 14, fontWeight: 500,
                    ...(plan.ctaKind === "primary"
                      ? { background: "var(--genessa-gradient)", color: "#fff", boxShadow: "var(--shadow-glow)" }
                      : { background: "var(--bg)", color: "var(--fg)", border: "1px solid var(--border-strong)" }),
                  }}
                >
                  {plan.cta.label}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Partner cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 80 }}>
          {/* Agency Partner */}
          <div style={{
            borderRadius: 14, padding: "22px 22px 22px 28px",
            background: "var(--bg-subtle)", border: "1px solid var(--border)",
            position: "relative", overflow: "hidden",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "var(--genessa-gradient)" }} />
            <div style={{ fontSize: 10, color: "var(--fg-3)", fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Enterprise</div>
            <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0, letterSpacing: "-0.02em", color: "var(--fg)" }}>Enterprise Partner</h3>
            <p style={{ fontSize: 13, color: "var(--fg-2)", margin: 0, lineHeight: 1.55 }}>
              Manage multiple brands and subsidiaries under one account. Built for holdings, universities, and franchise networks.
            </p>
            <p style={{ fontSize: 12, color: "var(--fg-3)", margin: 0 }}>10 entities · Unified dashboard · Custom pricing</p>
            <Link
              href="/partner#agency"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                marginTop: 6, padding: "8px 16px", borderRadius: 8, width: "fit-content",
                background: "var(--bg)", border: "1px solid var(--border-strong)",
                fontSize: 13, fontWeight: 500, color: "var(--fg)", textDecoration: "none",
              }}
            >
              Get in touch →
            </Link>
          </div>

          {/* AI Visibility Program */}
          <div style={{
            borderRadius: 14, padding: "22px 22px 22px 28px",
            background: "var(--bg-subtle)", border: "1px solid var(--border)",
            position: "relative", overflow: "hidden",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "var(--genessa-gradient)" }} />
            <div style={{ fontSize: 10, color: "var(--fg-3)", fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Program</div>
            <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0, letterSpacing: "-0.02em", color: "var(--fg)" }}>AI Visibility Program</h3>
            <p style={{ fontSize: 13, color: "var(--fg-2)", margin: 0, lineHeight: 1.55 }}>
              Make a difference in 3 months with an AI consultant built for your industry.
            </p>
            <p style={{ fontSize: 12, color: "var(--fg-3)", margin: 0 }}>Sector-specific · 3 / 6 / 12 months · Weekly action steps</p>
            <Link
              href="/partner#program"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                marginTop: 6, padding: "8px 16px", borderRadius: 8, width: "fit-content",
                background: "var(--genessa-gradient)", border: "none",
                fontSize: 13, fontWeight: 500, color: "#fff", textDecoration: "none",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              Explore the program →
            </Link>
          </div>
        </div>

        {/* SECTION 2 — Comparison table */}
        <div style={{ marginBottom: 80 }}>
          <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.02em] mb-2">Compare plans</h2>
          <p style={{ fontSize: 14, color: "var(--fg-2)", marginBottom: 24 }}>Every feature, side by side.</p>

          <div className="overflow-x-auto rounded-[16px] border border-[var(--border)]" style={{ boxShadow: "var(--shadow-sm)" }}>
            <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 640 }}>
              <thead>
                <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}>
                  <th className="px-5 py-4 text-left" style={{ fontSize: 12, fontFamily: "var(--font-geist-mono)", color: "var(--fg-3)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500, width: "30%" }}>
                    Feature
                  </th>
                  {plansData.map((p) => (
                    <th key={p.name} className="px-5 py-4 text-center" style={{ fontSize: 12, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600, color: p.popular ? "var(--genessa-blue)" : "var(--fg-3)", width: "17.5%" }}>
                      {p.name}
                      {p.popular && (
                        <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-white text-[10px] font-semibold tracking-wide" style={{ background: "var(--genessa-gradient)", verticalAlign: "middle" }}>★</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={row.label} style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined, background: i % 2 === 0 ? "var(--bg)" : "var(--bg-subtle)" }}>
                    <td className="px-5 py-4 text-[13.5px] font-medium" style={{ color: "var(--fg)" }}>{row.label}</td>
                    <TableCell value={row.free} />
                    <TableCell value={row.starter} highlight />
                    <TableCell value={row.pro} />
                    <TableCell value={row.agency} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          <div>
            <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Do I need a credit card for Free?</h4>
            <p style={{ margin: 0, fontSize: 14, color: "var(--fg-2)", lineHeight: 1.55 }}>No. Free is free forever — no card, no signup required.</p>
          </div>
          <div>
            <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>What counts as one &ldquo;domain&rdquo;?</h4>
            <p style={{ margin: 0, fontSize: 14, color: "var(--fg-2)", lineHeight: 1.55 }}>One root domain, including subdomains and up to 200 indexed URLs.</p>
          </div>
          <div>
            <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Can I cancel anytime?</h4>
            <p style={{ margin: 0, fontSize: 14, color: "var(--fg-2)", lineHeight: 1.55 }}>Yes. Cancel from billing settings and keep access until the period ends.</p>
          </div>
          <div>
            <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>How is the score calculated?</h4>
            <p style={{ margin: 0, fontSize: 14, color: "var(--fg-2)", lineHeight: 1.55 }}>
              Weighted across 9 checks: Schema.org, llms.txt, Robots.txt, Open Graph, Entity links, H1/H2, Freshness, Speed, and Answer-first content. See{" "}
              <Link href="/how-it-works" style={{ color: "var(--genessa-blue)" }}>how it works</Link>.
            </p>
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
