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
            New · AI Visibility Scanner
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
        <FeatureCard glyph={<NetworkGlyph />} title="3 Visibility Scores" body="Readiness, Authority, and Influence — three angles that show exactly how AI systems perceive your site." />
        <FeatureCard glyph={<BadgeGlyph />} title="AI Insight Panel" body="Understand how AI systems see your content: what they trust, what they skip, and why." />
        <FeatureCard glyph={<DirectoryGlyph />} title="Actionable Fixes" body="Every failing check comes with a specific fix. Know what's missing and exactly how to correct it." />
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
        <FeatureTrio />
      </main>
      <Footer />
    </>
  );
}
