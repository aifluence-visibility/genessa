import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

const sections = [
  {
    title: "Information we collect",
    body: "When you use Genessa, we collect the domain name you submit for scanning, your IP address for rate limiting, and basic usage analytics (pages visited, browser type). We do not collect your name or email address unless you contact us directly.",
  },
  {
    title: "How we use your information",
    body: "We use domain names to run AI visibility audits and to generate your score report. Usage data helps us improve the product. We do not sell, rent, or share your information with third parties for marketing purposes.",
  },
  {
    title: "Cookies",
    body: "Genessa uses only essential cookies required for the service to function. We do not use tracking or advertising cookies. You can disable cookies in your browser settings without affecting core functionality.",
  },
  {
    title: "Data retention",
    body: "Scan results are cached for up to 24 hours to improve performance. We do not store long-term records of which domains you have scanned unless you create an account.",
  },
  {
    title: "Third-party services",
    body: "We use Vercel for hosting and edge computing. Vercel may log request metadata as part of its infrastructure. Please review Vercel's privacy policy for details.",
  },
  {
    title: "Your rights",
    body: "You may request deletion of any data associated with your account or IP address by contacting us at info@genessa.io. We will respond within 30 days.",
  },
  {
    title: "Changes to this policy",
    body: "We may update this Privacy Policy from time to time. We will note the date of the most recent revision at the top of this page. Continued use of Genessa after changes constitutes acceptance.",
  },
  {
    title: "Contact",
    body: "Questions about this policy? Email us at info@genessa.io and we will respond within 24 hours.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className="w-full max-w-[880px] mx-auto px-4 md:px-8" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <div className="relative text-center overflow-hidden" style={{ marginBottom: 48 }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(50% 60% at 50% 30%, rgba(75,123,255,0.14) 0%, rgba(123,63,228,0) 70%)" }} />
          <div className="relative">
            <div className="eyebrow" style={{ marginBottom: 16 }}>Legal</div>
            <h1 className="text-3xl md:text-[56px]" style={{ fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.05, margin: "0 0 14px" }}>
              Privacy <em className="serif-italic gradient-text" style={{ paddingRight: 4 }}>policy</em>
            </h1>
            <p className="text-sm md:text-[17px]" style={{ color: "var(--fg-2)", maxWidth: 480, margin: "0 auto" }}>
              Last updated May 11, 2026. We keep this short and readable.
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
