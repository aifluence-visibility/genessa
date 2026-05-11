"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { useState } from "react";

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="w-full max-w-[1200px] mx-auto px-4 md:px-8 py-4 md:py-5 flex items-center justify-between relative">
      <Link href="/" className="no-underline">
        <Logo />
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-7 text-sm text-[var(--fg-2)]">
        <Link href="/how-it-works" className="no-underline font-medium text-[var(--fg-2)]">How it works</Link>
        <Link href="/directory" className="no-underline font-medium text-[var(--fg-2)]">Directory</Link>
        <Link href="/pricing" className="no-underline font-medium text-[var(--fg-2)]">Pricing</Link>
        <Link href="/faq" className="no-underline font-medium text-[var(--fg-2)]">FAQ</Link>
        <Link href="/contact" className="no-underline font-medium text-[var(--fg-2)]">Contact</Link>
      </div>
      <div className="hidden md:flex items-center gap-3">
        <Link href="#" className="no-underline font-medium text-sm text-[var(--fg-2)]">Sign in</Link>
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
          <Link href="/directory" onClick={() => setOpen(false)} className="no-underline font-medium text-sm text-[var(--fg-2)]">Directory</Link>
          <Link href="/pricing" onClick={() => setOpen(false)} className="no-underline font-medium text-sm text-[var(--fg-2)]">Pricing</Link>
          <Link href="/faq" onClick={() => setOpen(false)} className="no-underline font-medium text-sm text-[var(--fg-2)]">FAQ</Link>
          <Link href="/contact" onClick={() => setOpen(false)} className="no-underline font-medium text-sm text-[var(--fg-2)]">Contact</Link>
          <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)]">
            <Link href="#" className="no-underline font-medium text-sm text-[var(--fg-2)]">Sign in</Link>
            <Link href="/" className="no-underline text-sm font-medium px-3.5 py-2 rounded-[10px] border border-[var(--border-strong)] bg-[var(--bg)] text-[var(--fg)]">
              Get score
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
