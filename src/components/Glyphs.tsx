export function NetworkGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="url(#fgrad)" strokeWidth="1.5" strokeLinecap="round">
      <defs><linearGradient id="fgrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#2952E3" /><stop offset="1" stopColor="#7B3FE4" /></linearGradient></defs>
      <line x1="12" y1="12" x2="4" y2="5" /><line x1="12" y1="12" x2="20" y2="5" />
      <line x1="12" y1="12" x2="4" y2="19" /><line x1="12" y1="12" x2="20" y2="19" />
      <circle cx="12" cy="12" r="2.4" fill="url(#fgrad)" stroke="none" />
      <circle cx="4" cy="5" r="1.4" fill="url(#fgrad)" stroke="none" />
      <circle cx="20" cy="5" r="1.4" fill="url(#fgrad)" stroke="none" />
      <circle cx="4" cy="19" r="1.4" fill="url(#fgrad)" stroke="none" />
      <circle cx="20" cy="19" r="1.4" fill="url(#fgrad)" stroke="none" />
    </svg>
  );
}

export function BadgeGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="url(#bgrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <defs><linearGradient id="bgrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#2952E3" /><stop offset="1" stopColor="#7B3FE4" /></linearGradient></defs>
      <path d="M12 2 4 5v6c0 5 3 9 8 11 5-2 8-6 8-11V5l-8-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function DirectoryGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="url(#dgrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <defs><linearGradient id="dgrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#2952E3" /><stop offset="1" stopColor="#7B3FE4" /></linearGradient></defs>
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function GradientGlyph({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#sg2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <defs><linearGradient id="sg2" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#2952E3" /><stop offset="1" stopColor="#7B3FE4" /></linearGradient></defs>
      <path d={d} />
    </svg>
  );
}
