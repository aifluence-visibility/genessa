"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UrlField() {
  const [url, setUrl] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = url.trim() || "acme.com";
    router.push(`/score?url=${encodeURIComponent(target)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row max-w-[540px] mx-auto rounded-[14px] overflow-hidden" style={{
      border: `1px solid ${focused ? "var(--genessa-blue)" : "var(--border-strong)"}`,
      background: "var(--bg)",
      boxShadow: focused ? "var(--shadow-glow)" : "var(--shadow-sm)",
      transition: "all 220ms cubic-bezier(0.22, 1, 0.36, 1)",
    }}>
      <div className="flex items-center flex-1">
        <div className="flex items-center pl-4 text-[var(--fg-3)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
        <input value={url} onChange={(e) => setUrl(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder="https://yoursite.com"
          className="flex-1 min-w-0 border-none outline-none p-4 text-base bg-transparent text-[var(--fg)]"
          style={{ fontFamily: "var(--font-geist-sans)" }} />
      </div>
      <button type="submit" className="border-none text-white font-medium text-[15px] px-6 py-3.5 sm:py-0 cursor-pointer whitespace-nowrap" style={{
        background: "var(--genessa-gradient)",
        fontFamily: "var(--font-geist-sans)", letterSpacing: "-0.005em",
      }}>
        Get free score
      </button>
    </form>
  );
}
