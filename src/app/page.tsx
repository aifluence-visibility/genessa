import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { UrlField } from "@/components/UrlField";
import Link from "next/link";

function Hero() {
  return (
    <section className="relative text-center px-4 md:px-8 pt-12 md:pt-20 pb-10 md:pb-16 max-w-[900px] mx-auto">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(60% 60% at 50% 35%, rgba(75,123,255,0.18) 0%, rgba(123,63,228,0) 70%)" }} />
      <div className="relative z-10">
        {/* Brand pill */}
        <div className="flex flex-wrap justify-center gap-3 mb-5 md:mb-6">
          <div className="eyebrow inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-subtle)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--score-good)]" />
            Genessa by NurdAI · AI Visibility
          </div>
        </div>

        <h1 className="text-[clamp(32px,7vw,80px)] font-medium tracking-[-0.04em] leading-[1.02] mb-4 md:mb-5 text-[var(--fg)]">
          AI mentions you or your{" "}
          <em className="serif-italic gradient-text pr-1">competitors</em>
          {" "}— find out which
        </h1>

        <p className="text-base md:text-lg text-[var(--fg-2)] leading-relaxed max-w-[600px] mx-auto mb-4 md:mb-5">
          Genessa runs your prompts through Claude, GPT-4o, and Perplexity to measure citation rate, share of voice, and sentiment — across every AI engine that matters.
        </p>

        {/* Two CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 md:mb-8">
          <Link
            href="/onboarding"
            className="no-underline text-[15px] font-medium px-6 py-3 rounded-[12px] text-white"
            style={{ background: "var(--genessa-gradient)", boxShadow: "var(--shadow-glow)" }}
          >
            Start tracking my brand →
          </Link>
          <span className="text-[13px] text-[var(--fg-3)]">or check your site&apos;s AI readiness:</span>
        </div>

        <UrlField />
        <div className="mt-4 text-[13px] text-[var(--fg-3)]">Free scan — no signup required.</div>
      </div>
    </section>
  );
}

function EngineLogos() {
  return (
    <section className="px-4 md:px-8 pb-10 md:pb-14 max-w-[700px] mx-auto text-center">
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--fg-3)] mb-4" style={{ fontFamily: "var(--font-geist-mono)" }}>
        Monitored across
      </div>
      <div className="flex items-center justify-center gap-6 flex-wrap">
        {[
          { name: "Claude", color: "#D97706" },
          { name: "GPT-4o", color: "#16A34A" },
          { name: "Perplexity", color: "#7C3AED" },
        ].map((e) => (
          <span key={e.name} style={{
            fontSize: 13, fontWeight: 600, color: e.color,
            padding: "5px 14px", borderRadius: 99,
            background: e.color + "18",
            border: `1px solid ${e.color}33`,
            fontFamily: "var(--font-geist-mono)",
          }}>
            {e.name}
          </span>
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-3 p-5 md:p-6 rounded-[14px] border border-[var(--border)] bg-[var(--bg)]">
      <div className="text-2xl">{icon}</div>
      <div className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--fg)]">{title}</div>
      <div className="text-sm text-[var(--fg-2)] leading-[1.55]">{body}</div>
    </div>
  );
}

function FeatureTrio() {
  return (
    <section className="px-4 md:px-8 pt-4 pb-16 md:pb-24 max-w-[1100px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FeatureCard
          icon="🔭"
          title="Multi-engine monitoring"
          body="Your prompts run across Claude, GPT-4o, and Perplexity — 3× each — so citation rates are statistically reliable, not one-off results."
        />
        <FeatureCard
          icon="📊"
          title="Citation rate & share of voice"
          body="See what % of AI queries mention your brand, how you rank against competitors, and how sentiment breaks down per engine."
        />
        <FeatureCard
          icon="📈"
          title="Trend over time"
          body="Each tour adds a data point. Track whether your AI visibility is growing week over week as you publish, fix, and optimize."
        />
      </div>

      {/* Separator */}
      <div className="mt-10 mb-10 border-t border-[var(--border)]" />

      {/* Social proof / CTA strip */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-1">
        <div>
          <div className="text-[15px] font-semibold text-[var(--fg)] mb-1">Ready to see where you stand?</div>
          <div className="text-[13px] text-[var(--fg-2)]">
            $49 one-time · No subscription · Credits added within 24h
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/pricing"
            className="no-underline text-[13px] font-medium px-4 py-2.5 rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg)] text-[var(--fg)]"
          >
            See pricing
          </Link>
          <Link
            href="/onboarding"
            className="no-underline text-[13px] font-medium px-4 py-2.5 rounded-[10px] text-white"
            style={{ background: "var(--genessa-gradient)" }}
          >
            Get started →
          </Link>
        </div>
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
        <EngineLogos />
        <FeatureTrio />
      </main>
      <Footer />
    </>
  );
}
