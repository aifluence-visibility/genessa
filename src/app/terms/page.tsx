import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

const sections = [
  {
    title: "Acceptance of terms",
    body: "By accessing or using Genessa (genessa.io), you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.",
  },
  {
    title: "Description of service",
    body: "Genessa provides AI visibility scoring for websites. We scan publicly accessible URLs and return a score based on how well the site can be read by AI systems. The free tier is available without registration.",
  },
  {
    title: "Acceptable use",
    body: "You may only scan domains you own or have explicit permission to audit. You may not use Genessa to overload servers, circumvent rate limits, or scan domains in bulk without a commercial agreement. Abuse will result in IP bans.",
  },
  {
    title: "Accuracy of scores",
    body: "Genessa scores are provided for informational purposes only. Scores reflect our best-effort assessment at the time of scanning and may not represent every factor AI systems use. We make no guarantee that a higher score will result in more AI citations.",
  },
  {
    title: "Intellectual property",
    body: "The Genessa name, logo, and scoring methodology are owned by Genessa Inc. Badge embeds are licensed for use on the scanned domain only. You may not resell or white-label Genessa scores without a written commercial agreement.",
  },
  {
    title: "Limitation of liability",
    body: "Genessa is provided \"as is\" without warranties of any kind. We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the service.",
  },
  {
    title: "Termination",
    body: "We reserve the right to suspend or terminate access to Genessa for any user who violates these terms, at our sole discretion and without prior notice.",
  },
  {
    title: "Changes to terms",
    body: "We may update these Terms from time to time. Continued use of Genessa after changes constitutes acceptance of the revised terms. We will update the date at the top of this page when changes are made.",
  },
  {
    title: "Contact",
    body: "Questions about these terms? Reach us at info@genessa.io.",
  },
];

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main className="w-full max-w-[880px] mx-auto px-4 md:px-8" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <div className="relative text-center overflow-hidden" style={{ marginBottom: 48 }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(50% 60% at 50% 30%, rgba(75,123,255,0.14) 0%, rgba(123,63,228,0) 70%)" }} />
          <div className="relative">
            <div className="eyebrow" style={{ marginBottom: 16 }}>Legal</div>
            <h1 className="text-3xl md:text-[56px]" style={{ fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.05, margin: "0 0 14px" }}>
              Terms of <em className="serif-italic gradient-text" style={{ paddingRight: 4 }}>service</em>
            </h1>
            <p className="text-sm md:text-[17px]" style={{ color: "var(--fg-2)", maxWidth: 480, margin: "0 auto" }}>
              Last updated May 11, 2026. Plain English. No legalese.
            </p>
          </div>
        </div>

        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-[var(--shadow-sm)] divide-y divide-[var(--border)]">
          {sections.map((s) => (
            <div key={s.title} className="px-5 md:px-8 py-6">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-2">{s.title}</h2>
              <p className="text-sm text-[var(--fg-2)] leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
