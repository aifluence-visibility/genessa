import type { ReactNode } from "react";

export function Panel({
  children,
  className = "",
  padding = "p-5",
}: {
  children: ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <div
      className={`rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--ink-0)] shadow-[var(--shadow-xs)] ${padding} ${className}`}
    >
      {children}
    </div>
  );
}
