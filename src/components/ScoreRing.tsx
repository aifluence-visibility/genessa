"use client";

import { useState, useEffect } from "react";

export function ScoreRing({ value, size = 200, animate = true }: { value: number; size?: number; animate?: boolean }) {
  const r = 86;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = value >= 80 ? "url(#sg)" : value >= 60 ? "#F59E0B" : "#EF4444";
  const [drawn, setDrawn] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    const t = setTimeout(() => setDrawn(true), 60);
    return () => clearTimeout(t);
  }, [animate]);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 200 200" style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#2952E3" />
            <stop offset="1" stopColor="#7B3FE4" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={r} stroke="var(--border)" strokeWidth="12" fill="none" />
        <circle cx="100" cy="100" r={r} stroke={color} strokeWidth="12" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={drawn ? offset : c}
          style={{ transition: animate ? "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" : "none" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div style={{
          fontFamily: "var(--font-geist-mono)", fontSize: size * 0.32, fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1,
          ...(value >= 80
            ? { background: "var(--genessa-gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
            : { color: value >= 60 ? "#F59E0B" : "#EF4444" })
        }}>{value}</div>
        <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, color: "var(--fg-3)", marginTop: 6 }}>/ 100</div>
      </div>
    </div>
  );
}
