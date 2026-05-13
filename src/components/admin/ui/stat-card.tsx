export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--ink-0)] p-4 shadow-[var(--shadow-xs)] sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-[var(--ink-800)]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--ink-500)]">{hint}</p> : null}
    </div>
  );
}
