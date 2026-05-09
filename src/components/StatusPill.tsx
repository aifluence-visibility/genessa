const map = {
  pass: { bg: "var(--score-good-bg)", fg: "#10B981", dot: "#10B981" },
  partial: { bg: "var(--score-mid-bg)", fg: "#B45309", dot: "#F59E0B" },
  fail: { bg: "var(--score-poor-bg)", fg: "#EF4444", dot: "#EF4444" },
} as const;

export function StatusPill({ kind, label }: { kind: "pass" | "partial" | "fail"; label: string }) {
  const m = map[kind];
  return (
    <span className="inline-flex items-center gap-1.5" style={{
      padding: "3px 10px", borderRadius: 99, background: m.bg, color: m.fg,
      fontFamily: "var(--font-geist-mono)", fontSize: 11, fontWeight: 500,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: m.dot }} />
      {label}
    </span>
  );
}
