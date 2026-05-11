import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import Link from "next/link";

function Check({ grad }: { grad?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={grad ? "url(#pcg)" : "var(--fg-3)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ marginTop: 2 }}>
      <defs><linearGradient id="pcg" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#2952E3" /><stop offset="1" stopColor="#7B3FE4" /></linearGradient></defs>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Dash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="2.5" strokeLinecap="round" className="shrink-0" style={{ marginTop: 2 }}>
      <line x1="6" y1="12" x2="18" y2="12" />
    </svg>
  );
}

const tiers = [
  {
    name: "Free", price: "$0", per: "forever",
    desc: "Score your site, see what's missing. Perfect for a one-time check.",
    features: [
      { ok: true, text: "AI visibility score (0–100)" },
      { ok: true, text: "Full breakdown across 9 checks" },
      { ok: false, text: "Embeddable badge" },
      { ok: false, text: "Listed in Verified Directory" },
      { ok: false, text: "Weekly score tracking" },
    ],
    cta: { label: "Get free score", kind: "secondary" as const },
  },
  {
    name: "Verified", price: "$29", per: "/ month", popular: true,
    desc: "The whole stack: badge, directory listing, weekly score tracking, alerts.",
    features: [
      { ok: true, text: "Everything in Free" },
      { ok: true, text: "Embeddable Verified badge" },
      { ok: true, text: "Auto-listing in Verified Directory" },
      { ok: true, text: "Weekly score tracking + email alerts" },
      { ok: true, text: "Competitor benchmarking (3 sites)" },
    ],
    cta: { label: "Start 14-day trial", kind: "primary" as const },
  },
  {
    name: "Consulting", price: "Custom", per: "",
    desc: "We audit, recommend, and implement. End-to-end fix for AI visibility.",
    features: [
      { ok: true, text: "Everything in Verified" },
      { ok: true, text: "Full audit (multi-site, sub-pages)" },
      { ok: true, text: "Implementation by our team" },
      { ok: true, text: "Schema.org & llms.txt build-out" },
      { ok: true, text: "Quarterly review + roadmap" },
    ],
    cta: { label: "Get a quote", kind: "secondary" as const },
  },
];

export default function Pricing() {
  return (
    <>
      <Nav />
      <main className="w-full max-w-[1100px] mx-auto px-4 md:px-8 overflow-hidden" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <div className="relative text-center" style={{ marginBottom: 56 }}>
          <div className="absolute pointer-events-none" style={{ inset: -20, background: "radial-gradient(50% 60% at 50% 30%, rgba(75,123,255,0.14) 0%, rgba(123,63,228,0) 70%)" }} />
          <div className="relative">
            <div className="eyebrow" style={{ marginBottom: 16 }}>Pricing</div>
            <h1 className="text-3xl md:text-[56px]" style={{ fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.05, margin: "0 0 14px" }}>
              Score, then <em className="serif-italic gradient-text" style={{ paddingRight: 4 }}>signal</em>
            </h1>
            <p className="text-sm md:text-[17px]" style={{ color: "var(--fg-2)", maxWidth: 540, margin: "0 auto" }}>Free to score. Pay to verify. We&apos;ll do the work for you if you&apos;d rather not.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px] items-stretch">
          {tiers.map((t) => (
            <div key={t.name} className={`relative flex flex-col gap-[18px] p-6 md:p-8 ${t.popular ? "md:-translate-y-2" : ""}`} style={{
              background: "var(--bg)",
              border: t.popular ? "1.5px solid transparent" : "1px solid var(--border)",
              borderRadius: 18,
              ...(t.popular ? {
                background: "linear-gradient(var(--bg),var(--bg)) padding-box, var(--genessa-gradient) border-box",
                boxShadow: "var(--shadow-glow)",
              } : {}),
            }}>
              {t.popular && <span className="absolute" style={{ top: -12, left: "50%", transform: "translateX(-50%)", padding: "5px 14px", borderRadius: 99, background: "var(--genessa-gradient)", color: "#fff", fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Most popular</span>}
              <div style={{ fontSize: 14, fontFamily: "var(--font-geist-mono)", color: "var(--fg-3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{t.name}</div>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-4xl md:text-[56px] ${t.popular ? "gradient-text" : ""}`} style={{ fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1 }}>{t.price}</span>
                {t.per && <span style={{ fontSize: 15, color: "var(--fg-3)" }}>{t.per}</span>}
              </div>
              <div style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.55, minHeight: 42 }}>{t.desc}</div>
              <ul className="flex flex-col gap-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {t.features.map((f) => (
                  <li key={f.text} className={`flex items-start gap-2.5 text-sm ${f.ok ? "" : "text-[var(--fg-3)]"}`}>
                    {f.ok ? <Check grad={t.popular} /> : <Dash />}
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/" className="block text-center no-underline" style={{
                padding: "13px 20px", borderRadius: 10, fontFamily: "var(--font-geist-sans)", fontSize: 14, fontWeight: 500, cursor: "pointer",
                ...(t.cta.kind === "primary"
                  ? { background: "var(--genessa-gradient)", color: "#fff", boxShadow: "var(--shadow-glow)", border: "none" }
                  : { background: "var(--bg)", color: "var(--fg)", border: "1px solid var(--border)" }),
              }}>{t.cta.label}</Link>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mt-16">
          <div>
            <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Do I need a credit card for Free?</h4>
            <p style={{ margin: 0, fontSize: 14, color: "var(--fg-2)", lineHeight: 1.55 }}>No. Free runs forever, no signup needed.</p>
          </div>
          <div>
            <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>What counts as one &ldquo;site&rdquo;?</h4>
            <p style={{ margin: 0, fontSize: 14, color: "var(--fg-2)", lineHeight: 1.55 }}>One root domain, including subdomains and up to 200 indexed URLs.</p>
          </div>
          <div>
            <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>Can I downgrade anytime?</h4>
            <p style={{ margin: 0, fontSize: 14, color: "var(--fg-2)", lineHeight: 1.55 }}>Yes. Cancel from billing settings; you keep access until the period ends.</p>
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
