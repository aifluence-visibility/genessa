export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="genessaGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2952E3" />
          <stop offset="1" stopColor="#7B3FE4" />
        </linearGradient>
      </defs>
      <g stroke="url(#genessaGrad)" strokeWidth="1.6" strokeLinecap="round">
        <line x1="16" y1="16" x2="6" y2="6" />
        <line x1="16" y1="16" x2="26" y2="6" />
        <line x1="16" y1="16" x2="6" y2="26" />
        <line x1="16" y1="16" x2="26" y2="26" />
        <line x1="16" y1="16" x2="16" y2="3" />
        <line x1="16" y1="16" x2="16" y2="29" />
      </g>
      <g fill="url(#genessaGrad)">
        <circle cx="6" cy="6" r="2.2" />
        <circle cx="26" cy="6" r="2.2" />
        <circle cx="6" cy="26" r="2.2" />
        <circle cx="26" cy="26" r="2.2" />
        <circle cx="16" cy="3" r="1.8" />
        <circle cx="16" cy="29" r="1.8" />
      </g>
      <circle cx="16" cy="16" r="4.5" fill="url(#genessaGrad)" />
      <circle cx="16" cy="16" r="2" fill="#fff" fillOpacity="0.95" />
    </svg>
  );
}

export function Logo({ size = 26, label = true }: { size?: number; label?: boolean }) {
  return (
    <div className="flex items-center gap-2.5" style={{ fontWeight: 600, fontSize: 20, letterSpacing: "-0.02em", color: "var(--fg)" }}>
      <LogoMark size={size} />
      {label && <span>Genessa</span>}
    </div>
  );
}
