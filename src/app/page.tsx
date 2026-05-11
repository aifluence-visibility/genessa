import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { UrlField } from "@/components/UrlField";
import { NetworkGlyph, BadgeGlyph, DirectoryGlyph } from "@/components/Glyphs";

function Hero() {
  return (
    <section className="relative text-center px-4 md:px-8 pt-12 md:pt-20 pb-10 md:pb-16 max-w-[880px] mx-auto">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(60% 60% at 50% 35%, rgba(75,123,255,0.18) 0%, rgba(123,63,228,0) 70%)" }} />
      <div className="relative z-10">
        <div className="flex flex-wrap justify-center gap-3 mb-5 md:mb-6">
          <div className="eyebrow inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-subtle)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--score-good)]" />
            New · llms.txt detection v2
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-medium" style={{ background: "#fff", boxShadow: "0 1px 2px rgba(11,11,17,0.06),0 0 0 1px rgba(11,11,17,0.06)", color: "#1A1A22" }}>
            <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
              <defs><linearGradient id="bgBadge" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#2952E3" /><stop offset="1" stopColor="#7B3FE4" /></linearGradient></defs>
              <g stroke="url(#bgBadge)" strokeWidth="1.6" strokeLinecap="round"><line x1="16" y1="16" x2="6" y2="6" /><line x1="16" y1="16" x2="26" y2="6" /><line x1="16" y1="16" x2="6" y2="26" /><line x1="16" y1="16" x2="26" y2="26" /></g>
              <circle cx="16" cy="16" r="4.5" fill="url(#bgBadge)" />
              <circle cx="16" cy="16" r="2" fill="#fff" fillOpacity="0.95" />
            </svg>
            AI Verified · Genessa ·{" "}
            <span style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 700, background: "var(--genessa-gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>100/100</span>
          </div>
        </div>
        <h1 className="text-[clamp(32px,7vw,80px)] font-medium tracking-[-0.04em] leading-[1.02] mb-4 md:mb-5 text-[var(--fg)]">
          Find out if AI can{" "}
          <em className="serif-italic gradient-text pr-1">see</em>{" "}
          your website
        </h1>
        <p className="text-base md:text-lg text-[var(--fg-2)] leading-relaxed max-w-[580px] mx-auto mb-7 md:mb-9">
          Genessa scans your site against 9 checks AI systems actually use — schema, llms.txt, page speed, freshness, and more. Free in 30 seconds.
        </p>
        <UrlField />
        <div className="mt-4 text-[13px] text-[var(--fg-3)]">No signup. No credit card. Bookmark the result.</div>
      </div>
    </section>
  );
}

function LogoCloud() {
  const names = ["LINEAR", "VERCEL", "STRIPE", "POSTHOG", "SUPABASE", "RESEND"];
  return (
    <section className="text-center px-4 md:px-8 pt-6 md:pt-8 pb-12 md:pb-16">
      <div className="eyebrow mb-5 md:mb-6 text-[var(--fg-3)]">Trusted by 50+ companies</div>
      <div className="flex flex-wrap justify-center gap-x-10 gap-y-6 md:gap-x-14 max-w-[880px] mx-auto opacity-55">
        {names.map((n) => (
          <div key={n} style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 14, letterSpacing: "0.06em", color: "var(--fg-2)" }}>{n}</div>
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ glyph, title, body }: { glyph: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-3 p-5 md:p-6 rounded-[14px] border border-[var(--border)] bg-[var(--bg)]">
      <div className="flex items-center justify-center w-11 h-11 rounded-[10px]" style={{ background: "var(--genessa-gradient-soft)" }}>{glyph}</div>
      <div className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--fg)]">{title}</div>
      <div className="text-sm text-[var(--fg-2)] leading-[1.55]">{body}</div>
    </div>
  );
}

function FeatureTrio() {
  return (
    <section className="px-4 md:px-8 pt-10 md:pt-16 pb-16 md:pb-24 max-w-[1100px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FeatureCard glyph={<NetworkGlyph />} title="AI Score" body="One number that tells you how visible you are to ChatGPT, Claude, and Perplexity. Updated weekly." />
        <FeatureCard glyph={<BadgeGlyph />} title="Verification badge" body="Drop a pill on your site that proves you're scored. Links back to your live report." />
        <FeatureCard glyph={<DirectoryGlyph />} title="Verified directory" body="Score 80+ and you're listed. AI agents query Genessa for vetted sources." />
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <LogoCloud />
        <FeatureTrio />
      </main>
      <Footer />
    </>
  );
}
