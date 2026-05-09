"use client";

import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <Nav />
      <main className="w-full max-w-[880px] mx-auto px-4 md:px-8" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <div className="relative text-center overflow-hidden" style={{ marginBottom: 48 }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(50% 60% at 50% 30%, rgba(75,123,255,0.14) 0%, rgba(123,63,228,0) 70%)" }} />
          <div className="relative">
            <div className="eyebrow" style={{ marginBottom: 16 }}>Contact</div>
            <h1 className="text-3xl md:text-[56px]" style={{ fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.05, margin: "0 0 14px" }}>
              Get in <em className="serif-italic gradient-text" style={{ paddingRight: 4 }}>touch</em>
            </h1>
            <p className="text-sm md:text-[17px]" style={{ color: "var(--fg-2)", maxWidth: 480, margin: "0 auto" }}>
              Have a question or need help? Drop us a message and we'll get back to you shortly.
            </p>
          </div>
        </div>

        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg)] overflow-hidden shadow-[var(--shadow-sm)]">
          <form onSubmit={handleSubmit} className="px-5 md:px-8 py-6 md:py-8 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="flex flex-col gap-1.5 flex-1">
                <label htmlFor="name" className="text-[13px] font-medium text-[var(--fg-2)]">Name</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="px-3.5 py-2.5 rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg)] text-[var(--fg)] text-sm outline-none focus:border-[#2952E3] transition-colors"
                  placeholder="Your name"
                  style={{ fontFamily: "var(--font-geist-sans)" }}
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label htmlFor="email" className="text-[13px] font-medium text-[var(--fg-2)]">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="px-3.5 py-2.5 rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg)] text-[var(--fg)] text-sm outline-none focus:border-[#2952E3] transition-colors"
                  placeholder="you@company.com"
                  style={{ fontFamily: "var(--font-geist-sans)" }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className="text-[13px] font-medium text-[var(--fg-2)]">Message</label>
              <textarea
                id="message"
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="px-3.5 py-2.5 rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg)] text-[var(--fg)] text-sm outline-none focus:border-[#2952E3] transition-colors resize-none"
                placeholder="How can we help?"
                style={{ fontFamily: "var(--font-geist-sans)" }}
              />
            </div>

            {status === "sent" && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-[10px] bg-[var(--score-good-bg)] text-[var(--score-good)] text-sm font-medium">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                Message sent — we'll be in touch soon.
              </div>
            )}
            {status === "error" && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-[10px] bg-[rgba(239,68,68,0.08)] text-[#DC2626] text-sm font-medium">
                Something went wrong. Please try again or email us at info@genessa.io.
              </div>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="self-start text-sm font-medium px-5 py-2.5 rounded-[10px] text-white cursor-pointer border-none disabled:opacity-60"
              style={{ background: "var(--genessa-gradient)", boxShadow: "var(--shadow-sm)", fontFamily: "var(--font-geist-sans)" }}
            >
              {status === "sending" ? "Sending…" : "Send message"}
            </button>
          </form>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="flex-1 rounded-[14px] border border-[var(--border)] bg-[var(--bg)] p-5 md:p-6 shadow-[var(--shadow-sm)]">
            <div className="text-sm font-semibold mb-1">Email us</div>
            <div className="text-sm text-[var(--fg-2)]">info@genessa.io</div>
          </div>
          <div className="flex-1 rounded-[14px] border border-[var(--border)] bg-[var(--bg)] p-5 md:p-6 shadow-[var(--shadow-sm)]">
            <div className="text-sm font-semibold mb-1">Response time</div>
            <div className="text-sm text-[var(--fg-2)]">Usually within 24 hours</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
