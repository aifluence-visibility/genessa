"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { useState, useEffect } from "react";
import { SECTOR_META, SECTOR_SLUGS } from "@/lib/sectorMeta";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function Nav() {
  const [open, setOpen] = useState(false);
  const [sectorsOpen, setSectorsOpen] = useState(false);
  const [mobileSectorsOpen, setMobileSectorsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        supabase.from("profiles").select("plan").eq("id", data.user.id).maybeSingle().then(({ data: p }) => {
          setUserPlan(p?.plan ?? "free");
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="w-full max-w-[1200px] mx-auto px-4 md:px-8 py-4 md:py-5 flex items-center justify-between relative">
      <Link href="/" className="no-underline">
        <Logo />
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-7 text-sm text-[var(--fg-2)]">
        <Link href="/how-it-works" className="no-underline font-medium text-[var(--fg-2)]">How it works</Link>

        {/* Sektörler dropdown */}
        <div
          className="relative"
          onMouseEnter={() => setSectorsOpen(true)}
          onMouseLeave={() => setSectorsOpen(false)}
        >
          <button
            onClick={() => setSectorsOpen((v) => !v)}
            className="font-medium text-[var(--fg-2)] flex items-center gap-1 cursor-pointer"
            style={{ background: "none", border: "none", fontSize: "inherit", fontFamily: "inherit", padding: 0 }}
          >
            Sectors
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: "transform 150ms", transform: sectorsOpen ? "rotate(180deg)" : "none" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {sectorsOpen && (
            <div
              style={{
                position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                zIndex: 100,
                background: "#111827", border: "1px solid #1F2937",
                borderRadius: 8, minWidth: 220,
                boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
                padding: "4px 0",
                paddingTop: 12,
              }}
            >
              {SECTOR_SLUGS.map((slug) => {
                const m = SECTOR_META[slug];
                return (
                  <Link
                    key={slug}
                    href={`/for/${slug}`}
                    onClick={() => setSectorsOpen(false)}
                    className="flex items-center gap-2.5 no-underline"
                    style={{ padding: "8px 16px", color: "#E5E7EB", fontSize: 13, fontWeight: 500 }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#1F2937")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: 15 }}>{m.emoji}</span>
                    <span>{m.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <Link href="/directory" className="no-underline font-medium text-[var(--fg-2)]">Directory</Link>
        <Link href="/pricing" className="no-underline font-medium text-[var(--fg-2)]">Pricing</Link>
        <Link href="/faq" className="no-underline font-medium text-[var(--fg-2)]">FAQ</Link>
        <Link href="/contact" className="no-underline font-medium text-[var(--fg-2)]">Contact</Link>
        <Link href="/partner" className="no-underline font-medium text-[var(--fg-2)]">Partner</Link>
        <Link href="/" className="no-underline font-semibold" style={{ background: "var(--genessa-gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Get Score</Link>
      </div>
      <div className="hidden md:flex items-center gap-3">
        {mounted && user && (userPlan === "agency" || userPlan === "consulting") && <Link href="/agency" className="no-underline font-medium text-sm text-[var(--fg-2)]">Enterprise</Link>}
        {mounted && user && <Link href="/dashboard" className="no-underline font-medium text-sm text-[var(--fg-2)]">Dashboard</Link>}
        {mounted && !user && <Link href="/auth/login" className="no-underline font-medium text-sm text-[var(--fg-2)]">Sign in</Link>}
        <Link href="/" className="no-underline text-sm font-medium px-3.5 py-2 rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg)] text-[var(--fg)]">
          Get score
        </Link>
      </div>

      {/* Mobile hamburger */}
      <button onClick={() => setOpen(!open)} className="md:hidden flex flex-col gap-1.5 p-2 -mr-2" style={{ background: "none", border: "none", cursor: "pointer" }}>
        <span className="block w-5 h-0.5 bg-[var(--fg)]" />
        <span className="block w-5 h-0.5 bg-[var(--fg)]" />
        <span className="block w-5 h-0.5 bg-[var(--fg)]" />
      </button>

      {/* Mobile menu */}
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 bg-[var(--bg)] border-b border-[var(--border)] px-4 py-4 flex flex-col gap-4 md:hidden shadow-lg">
          <Link href="/how-it-works" onClick={() => setOpen(false)} className="no-underline font-medium text-sm text-[var(--fg-2)]">How it works</Link>

          {/* Mobile Sektörler */}
          <div>
            <button
              onClick={() => setMobileSectorsOpen((v) => !v)}
              className="font-medium text-sm text-[var(--fg-2)] flex items-center gap-1 w-full"
              style={{ background: "none", border: "none", fontFamily: "inherit", padding: 0, cursor: "pointer" }}
            >
              Sectors
              <svg
                width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: "transform 150ms", transform: mobileSectorsOpen ? "rotate(180deg)" : "none" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {mobileSectorsOpen && (
              <div className="mt-2 flex flex-col gap-1 pl-2 border-l-2" style={{ borderColor: "var(--border)" }}>
                {SECTOR_SLUGS.map((slug) => {
                  const m = SECTOR_META[slug];
                  return (
                    <Link
                      key={slug}
                      href={`/for/${slug}`}
                      onClick={() => { setOpen(false); setMobileSectorsOpen(false); }}
                      className="flex items-center gap-2 no-underline py-1.5 text-sm text-[var(--fg-2)] font-medium"
                    >
                      <span>{m.emoji}</span>
                      <span>{m.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <Link href="/directory" onClick={() => setOpen(false)} className="no-underline font-medium text-sm text-[var(--fg-2)]">Directory</Link>
          <Link href="/pricing" onClick={() => setOpen(false)} className="no-underline font-medium text-sm text-[var(--fg-2)]">Pricing</Link>
          <Link href="/faq" onClick={() => setOpen(false)} className="no-underline font-medium text-sm text-[var(--fg-2)]">FAQ</Link>
          <Link href="/contact" onClick={() => setOpen(false)} className="no-underline font-medium text-sm text-[var(--fg-2)]">Contact</Link>
          <Link href="/partner" onClick={() => setOpen(false)} className="no-underline font-medium text-sm text-[var(--fg-2)]">Partner</Link>
          <Link href="/" onClick={() => setOpen(false)} className="no-underline font-semibold text-sm" style={{ background: "var(--genessa-gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Get Score</Link>
          <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
            {mounted && user && (userPlan === "agency" || userPlan === "consulting") && <Link href="/agency" onClick={() => setOpen(false)} className="no-underline font-medium text-sm text-[var(--fg-2)]">Enterprise</Link>}
            {mounted && user && <Link href="/dashboard" onClick={() => setOpen(false)} className="no-underline font-medium text-sm text-[var(--fg-2)]">Dashboard</Link>}
            {mounted && !user && <Link href="/auth/login" className="no-underline font-medium text-sm text-[var(--fg-2)]">Sign in</Link>}
            <Link href="/" className="no-underline text-sm font-medium px-3.5 py-2 rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg)] text-[var(--fg)]">
              Get score
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
