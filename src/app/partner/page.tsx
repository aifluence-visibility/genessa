"use client";

import { useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

const SECTORS = [
  "Restaurant / Hospitality",
  "Healthcare / Clinic",
  "Education",
  "E-commerce / SaaS",
  "Legal",
  "Creator / Personal Brand",
  "Hotel / Villa",
  "Other",
];

const CLIENT_COUNTS = ["1–4", "5–10", "11–25", "25+"];

function InputField({
  label, type = "text", value, onChange, placeholder, required = true,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder: string; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-2)" }}>{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          padding: "10px 14px", borderRadius: 9,
          border: `1px solid ${focused ? "var(--genessa-blue)" : "var(--border-strong)"}`,
          background: "var(--bg)", color: "var(--fg)", fontSize: 14, outline: "none",
          boxShadow: focused ? "var(--shadow-glow)" : "none",
          transition: "border-color 180ms ease, box-shadow 180ms ease",
          fontFamily: "var(--font-geist-sans)",
        }}
      />
    </div>
  );
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-2)" }}>{label}</label>
      <select
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: "10px 14px", borderRadius: 9,
          border: `1px solid ${focused ? "var(--genessa-blue)" : "var(--border-strong)"}`,
          background: "var(--bg)", color: value ? "var(--fg)" : "var(--fg-3)",
          fontSize: 14, outline: "none",
          boxShadow: focused ? "var(--shadow-glow)" : "none",
          transition: "border-color 180ms ease, box-shadow 180ms ease",
          fontFamily: "var(--font-geist-sans)",
          appearance: "none",
          cursor: "pointer",
        }}
      >
        <option value="" disabled>Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TextareaField({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-2)" }}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        rows={4}
        style={{
          padding: "10px 14px", borderRadius: 9,
          border: `1px solid ${focused ? "var(--genessa-blue)" : "var(--border-strong)"}`,
          background: "var(--bg)", color: "var(--fg)", fontSize: 14, outline: "none",
          boxShadow: focused ? "var(--shadow-glow)" : "none",
          transition: "border-color 180ms ease, box-shadow 180ms ease",
          fontFamily: "var(--font-geist-sans)", resize: "vertical", lineHeight: 1.6,
        }}
      />
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--genessa-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function PartnerPage() {
  const [progForm, setProgForm] = useState({ name: "", email: "", sector: "", message: "" });
  const [progStatus, setProgStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const [agencyForm, setAgencyForm] = useState({ name: "", agency: "", clients: "", email: "", message: "" });
  const [agencyStatus, setAgencyStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleProgSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProgStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...progForm, type: "program" }),
      });
      if (!res.ok) throw new Error();
      setProgStatus("sent");
    } catch {
      setProgStatus("error");
    }
  }

  async function handleAgencySubmit(e: React.FormEvent) {
    e.preventDefault();
    setAgencyStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...agencyForm, type: "agency" }),
      });
      if (!res.ok) throw new Error();
      setAgencyStatus("sent");
    } catch {
      setAgencyStatus("error");
    }
  }

  return (
    <>
      <Nav />
      <main className="w-full max-w-[860px] mx-auto px-4 md:px-8" style={{ paddingTop: 48, paddingBottom: 96 }}>

        {/* ── Hero ── */}
        <div className="relative text-center" style={{ marginBottom: 72 }}>
          <div className="absolute pointer-events-none" style={{ inset: -20, background: "radial-gradient(50% 60% at 50% 30%, rgba(75,123,255,0.14) 0%, rgba(123,63,228,0) 70%)" }} />
          <div className="relative">
            <div className="eyebrow" style={{ marginBottom: 16 }}>Partner</div>
            <h1 className="text-3xl md:text-[52px]" style={{ fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.08, margin: "0 0 14px" }}>
              Grow with{" "}
              <em className="serif-italic gradient-text" style={{ paddingRight: 4 }}>Genessa</em>
            </h1>
            <p className="text-sm md:text-[17px]" style={{ color: "var(--fg-2)", margin: "0 auto 32px", maxWidth: 440 }}>
              Two paths, one platform. Choose what fits your goal.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => scrollTo("program")}
                style={{
                  padding: "13px 26px", borderRadius: 10,
                  background: "var(--genessa-gradient)", color: "#fff",
                  fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer",
                  boxShadow: "var(--shadow-glow)", fontFamily: "var(--font-geist-sans)",
                }}
              >
                AI Visibility Program →
              </button>
              <button
                onClick={() => scrollTo("agency")}
                style={{
                  padding: "13px 26px", borderRadius: 10,
                  background: "var(--bg)", color: "var(--fg)",
                  fontSize: 14, fontWeight: 500,
                  border: "1px solid var(--border-strong)", cursor: "pointer",
                  fontFamily: "var(--font-geist-sans)",
                }}
              >
                Agency Partner →
              </button>
            </div>
          </div>
        </div>

        {/* ── Section 1 — AI Visibility Program ── */}
        <section id="program" style={{ scrollMarginTop: 80, marginBottom: 96 }}>
          <div style={{ marginBottom: 40 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>AI Visibility Program</div>
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.03em", margin: "0 0 14px" }}>
              Your industry-specific<br />AI consultant
            </h2>
            <p style={{ fontSize: 16, color: "var(--fg-2)", lineHeight: 1.65, maxWidth: 560, margin: 0 }}>
              Genessa assigns you a specialist agent trained on your sector — not a generic AI tool,
              but a consultant that speaks your industry&apos;s language and works toward your specific growth goals.
            </p>
          </div>

          {/* How it works */}
          <div style={{
            borderRadius: 16, padding: "28px 32px",
            background: "var(--bg-subtle)", border: "1px solid var(--border)",
            marginBottom: 32,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 22, fontFamily: "var(--font-geist-mono)" }}>
              How it works
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                {
                  step: "01",
                  title: "Choose your sector",
                  body: "Restaurant, clinic, SaaS, legal, education, hotel, creator — pick the one that describes your business.",
                },
                {
                  step: "02",
                  title: "Your agent is assigned",
                  body: "A specialist agent (Savor, Vita, Sage, Nexus, and others) is configured for your domain, language, and growth metrics.",
                },
                {
                  step: "03",
                  title: "Weekly action steps begin",
                  body: "Every week you receive a prioritised list of concrete actions — schema fixes, content improvements, authority signals — each tied to a score impact.",
                },
              ].map(({ step, title, body }) => (
                <div key={step} style={{ display: "flex", gap: 18 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: "linear-gradient(135deg, rgba(41,82,227,0.1), rgba(123,63,228,0.1))",
                    border: "1px solid rgba(41,82,227,0.18)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-geist-mono)", fontSize: 10, fontWeight: 700,
                    color: "var(--genessa-blue)",
                  }}>
                    {step}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>{title}</div>
                    <p style={{ fontSize: 13, color: "var(--fg-2)", margin: 0, lineHeight: 1.6 }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Program options */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
            {[
              { duration: "3 months", tag: "Quick start" },
              { duration: "6 months", tag: "Most popular" },
              { duration: "12 months", tag: "Full programme" },
            ].map(({ duration, tag }) => (
              <div
                key={duration}
                style={{
                  flex: 1, minWidth: 160, borderRadius: 12, padding: "18px 20px",
                  background: "var(--bg)", border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ fontSize: 10, fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--fg-3)", marginBottom: 6 }}>{tag}</div>
                <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)", marginBottom: 4 }}>{duration}</div>
                <div style={{ fontSize: 12, color: "var(--fg-3)" }}>Custom pricing</div>
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div style={{
            borderRadius: 16, padding: "32px",
            background: "var(--bg)", border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--fg)", marginBottom: 6 }}>Apply for the programme</div>
              <p style={{ fontSize: 13, color: "var(--fg-2)", margin: 0, lineHeight: 1.5 }}>
                Tell us about your business and we&apos;ll be in touch within 24 hours.
              </p>
            </div>

            {progStatus === "sent" ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", margin: "0 auto 16px",
                  background: "linear-gradient(135deg, rgba(41,82,227,0.1), rgba(123,63,228,0.1))",
                  border: "1px solid rgba(41,82,227,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--genessa-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: "0 0 6px" }}>Application received</p>
                <p style={{ fontSize: 13, color: "var(--fg-2)", margin: 0 }}>We&apos;ll be in touch within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleProgSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <InputField label="Name" value={progForm.name} onChange={(v) => setProgForm((f) => ({ ...f, name: v }))} placeholder="Your name" />
                  <InputField label="Email" type="email" value={progForm.email} onChange={(v) => setProgForm((f) => ({ ...f, email: v }))} placeholder="you@company.com" />
                </div>
                <SelectField label="Sector" value={progForm.sector} onChange={(v) => setProgForm((f) => ({ ...f, sector: v }))} options={SECTORS} />
                <TextareaField label="Message" value={progForm.message} onChange={(v) => setProgForm((f) => ({ ...f, message: v }))} placeholder="Tell us about your domain, current visibility, and goals…" />
                {progStatus === "error" && (
                  <p style={{ fontSize: 13, color: "var(--score-bad)", margin: 0 }}>Something went wrong. Please try again.</p>
                )}
                <button
                  type="submit"
                  disabled={progStatus === "sending"}
                  style={{
                    padding: "12px 24px", borderRadius: 10,
                    background: "var(--genessa-gradient)", color: "#fff",
                    fontSize: 14, fontWeight: 500, border: "none",
                    cursor: progStatus === "sending" ? "not-allowed" : "pointer",
                    opacity: progStatus === "sending" ? 0.7 : 1,
                    boxShadow: "var(--shadow-glow)",
                    fontFamily: "var(--font-geist-sans)",
                    alignSelf: "flex-start",
                  }}
                >
                  {progStatus === "sending" ? "Sending…" : "Send application →"}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", marginBottom: 96 }} />

        {/* ── Section 2 — Agency Partner ── */}
        <section id="agency" style={{ scrollMarginTop: 80 }}>
          <div style={{ marginBottom: 40 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Agency Partner</div>
            <h2 style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.03em", margin: "0 0 14px" }}>
              AI visibility<br />for your clients
            </h2>
            <p style={{ fontSize: 16, color: "var(--fg-2)", lineHeight: 1.65, maxWidth: 560, margin: 0 }}>
              Managing 5 or more clients? Become a Genessa Agency Partner and give your clients
              their own AI visibility dashboard — under your brand, on your terms.
            </p>
          </div>

          {/* What's included */}
          <div style={{
            borderRadius: 16, padding: "28px 32px",
            background: "var(--bg-subtle)", border: "1px solid var(--border)",
            marginBottom: 40,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20, fontFamily: "var(--font-geist-mono)" }}>
              What&apos;s included
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 32px" }}>
              {[
                "Manage all client domains in one dashboard",
                "PDF reports ready to send to clients",
                "Custom pricing negotiated per volume",
                "Early access to new features and agents",
                "Dedicated partner support channel",
                "White-label option available on request",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <CheckIcon />
                  <span style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.55 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agency contact form */}
          <div style={{
            borderRadius: 16, padding: "32px",
            background: "var(--bg)", border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--fg)", marginBottom: 6 }}>Apply for agency partnership</div>
              <p style={{ fontSize: 13, color: "var(--fg-2)", margin: 0, lineHeight: 1.5 }}>
                We&apos;ll reach out within 24 hours to discuss a custom plan.
              </p>
            </div>

            {agencyStatus === "sent" ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", margin: "0 auto 16px",
                  background: "linear-gradient(135deg, rgba(41,82,227,0.1), rgba(123,63,228,0.1))",
                  border: "1px solid rgba(41,82,227,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--genessa-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", margin: "0 0 6px" }}>Application received</p>
                <p style={{ fontSize: 13, color: "var(--fg-2)", margin: 0 }}>We&apos;ll be in touch within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleAgencySubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <InputField label="Your name" value={agencyForm.name} onChange={(v) => setAgencyForm((f) => ({ ...f, name: v }))} placeholder="Full name" />
                  <InputField label="Agency name" value={agencyForm.agency} onChange={(v) => setAgencyForm((f) => ({ ...f, agency: v }))} placeholder="Acme Digital" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <SelectField label="Number of clients" value={agencyForm.clients} onChange={(v) => setAgencyForm((f) => ({ ...f, clients: v }))} options={CLIENT_COUNTS} />
                  <InputField label="Email" type="email" value={agencyForm.email} onChange={(v) => setAgencyForm((f) => ({ ...f, email: v }))} placeholder="you@agency.com" />
                </div>
                <TextareaField label="Message" value={agencyForm.message} onChange={(v) => setAgencyForm((f) => ({ ...f, message: v }))} placeholder="Tell us about your agency and how you'd like to use Genessa…" />
                {agencyStatus === "error" && (
                  <p style={{ fontSize: 13, color: "var(--score-bad)", margin: 0 }}>Something went wrong. Please try again.</p>
                )}
                <button
                  type="submit"
                  disabled={agencyStatus === "sending"}
                  style={{
                    padding: "12px 24px", borderRadius: 10,
                    background: "var(--genessa-gradient)", color: "#fff",
                    fontSize: 14, fontWeight: 500, border: "none",
                    cursor: agencyStatus === "sending" ? "not-allowed" : "pointer",
                    opacity: agencyStatus === "sending" ? 0.7 : 1,
                    boxShadow: "var(--shadow-glow)",
                    fontFamily: "var(--font-geist-sans)",
                    alignSelf: "flex-start",
                  }}
                >
                  {agencyStatus === "sending" ? "Sending…" : "Send application →"}
                </button>
              </form>
            )}
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
