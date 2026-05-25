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

const ORG_TYPES = ["University", "Holding", "Franchise", "Multi-brand", "Other"];

type AgentColor = { name: string; bg: string; border: string; text: string; tooltip: string };

const AGENTS: AgentColor[] = [
  { name: "Savor",  bg: "rgba(249,115,22,0.10)",  border: "rgba(249,115,22,0.28)",  text: "#ea580c", tooltip: "Restaurant Intelligence Operator"  },
  { name: "Haven",  bg: "rgba(20,184,166,0.10)",   border: "rgba(20,184,166,0.28)",  text: "#0d9488", tooltip: "Hospitality Intelligence Operator" },
  { name: "Vita",   bg: "rgba(236,72,153,0.10)",   border: "rgba(236,72,153,0.28)",  text: "#db2777", tooltip: "Medical Intelligence Operator"      },
  { name: "Sage",   bg: "rgba(34,197,94,0.10)",    border: "rgba(34,197,94,0.28)",   text: "#16a34a", tooltip: "Education Intelligence Operator"   },
  { name: "Flux",   bg: "rgba(59,130,246,0.10)",   border: "rgba(59,130,246,0.28)",  text: "#2563eb", tooltip: "Commerce Intelligence Operator"    },
  { name: "Nexus",  bg: "rgba(168,85,247,0.10)",   border: "rgba(168,85,247,0.28)",  text: "#9333ea", tooltip: "SaaS Intelligence Operator"        },
  { name: "Stone",  bg: "rgba(120,113,108,0.10)",  border: "rgba(120,113,108,0.28)", text: "#57534e", tooltip: "Property Intelligence Operator"    },
  { name: "Vero",   bg: "rgba(6,182,212,0.10)",    border: "rgba(6,182,212,0.28)",   text: "#0891b2", tooltip: "Legal Intelligence Operator"       },
  { name: "Calix",  bg: "rgba(245,158,11,0.10)",   border: "rgba(245,158,11,0.28)",  text: "#d97706", tooltip: "Finance Intelligence Operator"     },
  { name: "Lumen",  bg: "rgba(132,204,22,0.10)",   border: "rgba(132,204,22,0.28)",  text: "#65a30d", tooltip: "Creator Intelligence Operator"     },
  { name: "Jan",   bg: "rgba(99,102,241,0.10)",   border: "rgba(99,102,241,0.28)",  text: "#4f46e5", tooltip: "Marketing Intelligence Operator"   },
];

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

function SuccessState({ message }: { message: string }) {
  return (
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
      <p style={{ fontSize: 13, color: "var(--fg-2)", margin: 0 }}>{message}</p>
    </div>
  );
}

function AgentPill({ agent }: { agent: AgentColor }) {
  const [hovered, setHovered] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <span
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "inline-flex", alignItems: "center",
          padding: "5px 13px", borderRadius: 99,
          background: agent.bg,
          border: `1px solid ${agent.border}`,
          color: agent.text,
          fontSize: 13, fontWeight: 500,
          cursor: "default",
          transition: "transform 180ms ease, box-shadow 180ms ease",
          transform: hovered ? "translateY(-1px)" : "translateY(0)",
          boxShadow: hovered ? `0 3px 10px ${agent.border}` : "none",
          fontFamily: "var(--font-geist-sans)",
        }}
      >
        {agent.name}
      </span>
      <span
        style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: "50%",
          transform: `translateX(-50%) translateY(${hovered ? 0 : 4}px)`,
          opacity: hovered ? 1 : 0,
          pointerEvents: "none",
          transition: "opacity 160ms ease, transform 160ms ease",
          background: "#111827",
          color: "#fff",
          fontSize: 11,
          fontWeight: 500,
          padding: "5px 9px",
          borderRadius: 6,
          whiteSpace: "nowrap",
          zIndex: 50,
          fontFamily: "var(--font-geist-sans)",
          lineHeight: 1,
        }}
      >
        {agent.tooltip}
        <span style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "5px solid transparent",
          borderRight: "5px solid transparent",
          borderTop: "5px solid #111827",
        }} />
      </span>
    </span>
  );
}

export default function PartnerPage() {
  const [progForm, setProgForm] = useState({ name: "", email: "", sector: "", message: "" });
  const [progStatus, setProgStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const [agencyForm, setAgencyForm] = useState({ name: "", company: "", orgType: "", entities: "", email: "", message: "" });
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
        body: JSON.stringify({ ...agencyForm, type: "enterprise" }),
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

      {/* ── Hero — full-width gradient ── */}
      <div style={{
        background: "linear-gradient(180deg, rgba(75,123,255,0.09) 0%, rgba(123,63,228,0.05) 55%, transparent 100%)",
        borderBottom: "1px solid var(--border)",
        paddingTop: 72,
        paddingBottom: 72,
      }}>
        <div className="w-full px-4 md:px-8" style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Partner</div>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.06, margin: "0 0 14px" }}>
            Grow with{" "}
            <em className="serif-italic gradient-text" style={{ paddingRight: 4 }}>Genessa</em>
          </h1>
          <p style={{ fontSize: 17, color: "var(--fg-2)", margin: "0 auto 48px", maxWidth: 400 }}>
            Two paths, one platform.
          </p>

          {/* Two hero cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ maxWidth: 680, margin: "0 auto" }}>
            <button
              onClick={() => scrollTo("program")}
              style={{
                textAlign: "left", padding: "24px 24px 20px",
                borderRadius: 16, border: "1px solid var(--border)",
                background: "var(--bg)", cursor: "pointer",
                boxShadow: "var(--shadow-sm)",
                display: "flex", flexDirection: "column", gap: 10,
                fontFamily: "var(--font-geist-sans)",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(135deg, rgba(41,82,227,0.12), rgba(123,63,228,0.12))",
                border: "1px solid rgba(41,82,227,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--genessa-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)", marginBottom: 5 }}>
                  AI Visibility Program
                </div>
                <p style={{ fontSize: 13, color: "var(--fg-2)", margin: 0, lineHeight: 1.55 }}>
                  Your sector-specific AI consultant, working toward your growth goals.
                </p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--genessa-blue)" }}>Learn more →</span>
            </button>

            <button
              onClick={() => scrollTo("agency")}
              style={{
                textAlign: "left", padding: "24px 24px 20px",
                borderRadius: 16, border: "1px solid var(--border)",
                background: "var(--bg)", cursor: "pointer",
                boxShadow: "var(--shadow-sm)",
                display: "flex", flexDirection: "column", gap: 10,
                fontFamily: "var(--font-geist-sans)",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(135deg, rgba(41,82,227,0.12), rgba(123,63,228,0.12))",
                border: "1px solid rgba(41,82,227,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--genessa-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)", marginBottom: 5 }}>
                  Enterprise & Corporate Partner
                </div>
                <p style={{ fontSize: 13, color: "var(--fg-2)", margin: 0, lineHeight: 1.55 }}>
                  Manage multiple brands, locations, or subsidiaries under one account. Built for holding companies, universities, and franchise networks.
                </p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--genessa-blue)" }}>Learn more →</span>
            </button>
          </div>
        </div>
      </div>

      <main className="w-full max-w-[1100px] mx-auto px-4 md:px-8" style={{ paddingTop: 80, paddingBottom: 96 }}>

        {/* ── Section 1 — AI Visibility Program ── */}
        <section id="program" style={{ scrollMarginTop: 80, marginBottom: 96 }}>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16" style={{ marginBottom: 48 }}>

            {/* Left: heading + description + agent pills */}
            <div>
              <div className="eyebrow" style={{ marginBottom: 14 }}>AI Visibility Program</div>
              <h2 style={{ fontSize: "clamp(26px, 3vw, 36px)", fontWeight: 600, letterSpacing: "-0.03em", margin: "0 0 16px", lineHeight: 1.2 }}>
                Your industry-specific<br />AI consultant
              </h2>
              <p style={{ fontSize: 15, color: "var(--fg-2)", lineHeight: 1.65, margin: "0 0 32px" }}>
                Genessa assigns you a specialist agent trained on your sector — not a generic AI tool,
                but a consultant that speaks your industry&apos;s language and works toward your specific growth goals.
              </p>
              <div>
                <div style={{ fontSize: 11, fontFamily: "var(--font-geist-mono)", color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                  Meet the agents
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {AGENTS.map((agent) => (
                    <AgentPill key={agent.name} agent={agent} />
                  ))}
                </div>
              </div>
            </div>

            {/* Right: duration cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, justifyContent: "center" }}>
              {[
                { duration: "3 months",  tag: "Quick Start",  scope: "Phase 1–2", popular: false },
                { duration: "6 months",  tag: "Most Popular", scope: "Phase 1–3", popular: true  },
                { duration: "12 months", tag: "Full Program",  scope: "Phase 1–4", popular: false },
              ].map(({ duration, tag, scope, popular }) => (
                <div
                  key={duration}
                  style={{
                    borderRadius: 14, padding: "18px 22px",
                    background: popular
                      ? "linear-gradient(var(--bg),var(--bg)) padding-box, var(--genessa-gradient) border-box"
                      : "var(--bg)",
                    border: popular ? "1.5px solid transparent" : "1px solid var(--border)",
                    boxShadow: popular ? "var(--shadow-glow)" : "var(--shadow-sm)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: 10, fontFamily: "var(--font-geist-mono)", textTransform: "uppercase",
                      letterSpacing: "0.08em", marginBottom: 4,
                      color: popular ? "var(--genessa-blue)" : "var(--fg-3)",
                    }}>{tag}</div>
                    <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)" }}>{duration}</div>
                    <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 3 }}>{scope}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)", fontFamily: "var(--font-geist-mono)" }}>Custom pricing</div>
                </div>
              ))}
            </div>
          </div>

          {/* Full-width apply form */}
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
              <SuccessState message="We'll be in touch within 24 hours." />
            ) : (
              <form onSubmit={handleProgSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
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
            <div className="eyebrow" style={{ marginBottom: 12 }}>Enterprise Partner</div>
            <h2 style={{ fontSize: "clamp(26px, 3vw, 36px)", fontWeight: 600, letterSpacing: "-0.03em", margin: "0 0 14px", lineHeight: 1.2 }}>
              Enterprise & Corporate<br />Partner
            </h2>
            <p style={{ fontSize: 15, color: "var(--fg-2)", lineHeight: 1.65, maxWidth: 560, margin: 0 }}>
              Manage multiple brands, locations, or subsidiaries under one account. Perfect for universities, holding companies, franchise networks, and multi-brand businesses.
            </p>
          </div>

          <div style={{
            borderRadius: 16, padding: "28px 32px",
            background: "var(--bg-subtle)", border: "1px solid var(--border)",
            marginBottom: 40,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20, fontFamily: "var(--font-geist-mono)" }}>
              What&apos;s included
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "12px 32px" }}>
              {[
                "Up to 10 business entities under one account",
                "Individual AI visibility scores per entity",
                "Unified dashboard across all brands",
                "PDF reports for each entity",
                "Growth Audit for all entities",
                "Dedicated support channel",
                "White-label option available on request",
                "Custom pricing negotiated per volume",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <CheckIcon />
                  <span style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.55 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Who is this for? */}
          <div style={{
            borderRadius: 16, padding: "28px 32px",
            background: "var(--bg-subtle)", border: "1px solid var(--border)",
            marginBottom: 40,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20, fontFamily: "var(--font-geist-mono)" }}>
              Who is this for?
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "12px 32px" }}>
              {[
                { emoji: "🎓", label: "Universities", desc: "main site + academy + online programs" },
                { emoji: "🏢", label: "Holdings", desc: "manage all subsidiaries in one dashboard" },
                { emoji: "🏪", label: "Franchises", desc: "track AI visibility across all locations" },
                { emoji: "🌐", label: "Multi-brand", desc: "different brands, one control center" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{item.emoji}</span>
                  <span style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.55 }}>
                    <strong style={{ color: "var(--fg)", fontWeight: 600 }}>{item.label}</strong>
                    {" — "}{item.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            borderRadius: 16, padding: "32px",
            background: "var(--bg)", border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--fg)", marginBottom: 6 }}>Apply for Enterprise Partnership</div>
              <p style={{ fontSize: 13, color: "var(--fg-2)", margin: 0, lineHeight: 1.5 }}>
                We&apos;ll reach out within 24 hours to discuss a custom plan.
              </p>
            </div>
            {agencyStatus === "sent" ? (
              <SuccessState message="We'll reach out within 24 hours to discuss a custom plan." />
            ) : (
              <form onSubmit={handleAgencySubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
                  <InputField label="Your name" value={agencyForm.name} onChange={(v) => setAgencyForm((f) => ({ ...f, name: v }))} placeholder="Full name" />
                  <InputField label="Company / Organization name" value={agencyForm.company} onChange={(v) => setAgencyForm((f) => ({ ...f, company: v }))} placeholder="Acme Holdings" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
                  <SelectField label="Type" value={agencyForm.orgType} onChange={(v) => setAgencyForm((f) => ({ ...f, orgType: v }))} options={ORG_TYPES} />
                  <InputField label="Number of entities" value={agencyForm.entities} onChange={(v) => setAgencyForm((f) => ({ ...f, entities: v }))} placeholder="e.g. 5" />
                </div>
                <InputField label="Email" type="email" value={agencyForm.email} onChange={(v) => setAgencyForm((f) => ({ ...f, email: v }))} placeholder="you@company.com" />
                <TextareaField label="Message" value={agencyForm.message} onChange={(v) => setAgencyForm((f) => ({ ...f, message: v }))} placeholder="Tell us about your organization…" />
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
