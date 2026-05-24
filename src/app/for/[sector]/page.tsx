import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SECTOR_META, SECTOR_SLUGS } from "@/lib/sectorMeta";
import type { Metadata } from "next";

export async function generateStaticParams() {
  return SECTOR_SLUGS.map((sector) => ({ sector }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sector: string }>;
}): Promise<Metadata> {
  const { sector } = await params;
  const meta = SECTOR_META[sector];
  if (!meta) return {};
  return {
    title: `${meta.emoji} ${meta.name} — AI Visibility Analysis | Genessa`,
    description: meta.subheadline,
  };
}

export default async function SectorPage({
  params,
}: {
  params: Promise<{ sector: string }>;
}) {
  const { sector } = await params;
  const meta = SECTOR_META[sector];
  if (!meta) notFound();

  const colorAlpha = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  };

  return (
    <>
      <Nav />
      <main className="flex-1">

        {/* ── Section 1: Hero ── */}
        <section className="relative text-center px-4 md:px-8 pt-14 md:pt-24 pb-14 md:pb-20 max-w-[860px] mx-auto">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(60% 55% at 50% 30%, ${colorAlpha(meta.color, 0.14)} 0%, transparent 70%)`,
            }}
          />
          <div className="relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-[13px] font-semibold"
              style={{
                background: colorAlpha(meta.color, 0.1),
                border: `1px solid ${colorAlpha(meta.color, 0.35)}`,
                color: meta.color,
              }}
            >
              <span>{meta.emoji}</span>
              <span>Genessa for {meta.name}</span>
            </div>

            {/* Headline */}
            <h1 className="text-[clamp(28px,6vw,64px)] font-medium tracking-[-0.04em] leading-[1.06] mb-5 text-[var(--fg)]">
              {meta.headline}
            </h1>

            {/* Subheadline */}
            <p className="text-base md:text-lg text-[var(--fg-2)] leading-relaxed max-w-[560px] mx-auto mb-7">
              {meta.subheadline}
            </p>

            {/* Pain point stat */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-[13px] font-medium"
              style={{
                background: "rgba(234,179,8,0.1)",
                border: "1px solid rgba(234,179,8,0.3)",
                color: "#A16207",
              }}
            >
              <span>⚠️</span>
              <span>{meta.painPoint}</span>
            </div>

            {/* CTA */}
            <div>
              <Link
                href={`/?sector=${meta.slug}`}
                className="inline-flex items-center gap-2 no-underline px-7 py-3.5 rounded-[12px] text-[15px] font-semibold text-white"
                style={{
                  background: meta.color,
                  boxShadow: `0 4px 20px ${colorAlpha(meta.color, 0.35)}`,
                }}
              >
                {meta.ctaLabel} →
              </Link>
            </div>
            <div className="mt-3 text-[13px] text-[var(--fg-3)]">
              Free · No signup required · Results in 60 seconds
            </div>
          </div>
        </section>

        {/* ── Section 2: Value props ── */}
        <section className="px-4 md:px-8 py-12 md:py-16 max-w-[900px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-[36px] font-medium tracking-[-0.03em] text-[var(--fg)] mb-3">
              What does Genessa analyze for this sector?
            </h2>
            <p className="text-[var(--fg-2)] text-sm md:text-base max-w-[480px] mx-auto">
              Genessa measures the signals that impact AI visibility for {meta.name} businesses.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meta.valueProps.map((prop, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-5 rounded-[14px] border border-[var(--border)] bg-[var(--bg)]"
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                <div
                  className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 mt-0.5"
                  style={{ background: colorAlpha(meta.color, 0.12) }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-[14px] text-[var(--fg)] leading-[1.55]">{prop}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3: Example query ── */}
        <section className="px-4 md:px-8 py-10 md:py-14 max-w-[780px] mx-auto">
          <div
            className="rounded-[20px] p-8 md:p-12 text-center"
            style={{
              background: "#111827",
              border: "1px solid #1F2937",
              boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
            }}
          >
            <p className="text-[13px] font-medium tracking-wide text-[#6B7280] uppercase mb-5" style={{ letterSpacing: "0.08em" }}>
              Someone is asking AI right now:
            </p>
            <blockquote
              className="text-[clamp(20px,4vw,32px)] font-medium italic leading-[1.3] mb-6"
              style={{
                color: "#F9FAFB",
                fontFamily: "var(--font-geist-sans)",
              }}
            >
              &ldquo;{meta.exampleQuery}&rdquo;
            </blockquote>
            <p className="text-[15px] text-[#9CA3AF] mb-8">
              Are you showing up for this query?
            </p>
            <Link
              href={`/?sector=${meta.slug}`}
              className="inline-flex items-center gap-2 no-underline px-7 py-3.5 rounded-[12px] text-[15px] font-semibold text-white"
              style={{
                background: meta.color,
                boxShadow: `0 4px 20px ${colorAlpha(meta.color, 0.4)}`,
              }}
            >
              {meta.ctaLabel} →
            </Link>
          </div>
        </section>

        {/* ── Section 4: Bottom CTA ── */}
        <section className="text-center px-4 md:px-8 py-14 md:py-20">
          <Link
            href={`/?sector=${meta.slug}`}
            className="inline-flex items-center gap-2 no-underline px-8 py-4 rounded-[14px] text-[16px] font-semibold text-white"
            style={{
              background: meta.color,
              boxShadow: `0 6px 28px ${colorAlpha(meta.color, 0.38)}`,
            }}
          >
            {meta.ctaLabel} →
          </Link>
          <div className="mt-4 text-[13px] text-[var(--fg-3)]">
            Free • No signup required • Results in 60 seconds
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
