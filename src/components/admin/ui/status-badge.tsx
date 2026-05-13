const variants = {
  neutral: "bg-[var(--ink-100)] text-[var(--ink-700)] ring-1 ring-[var(--ink-200)]",
  info: "bg-blue-50 text-blue-800 ring-1 ring-blue-100",
  success: "bg-[var(--score-good-bg)] text-emerald-800 ring-1 ring-emerald-100/80",
  warning: "bg-[var(--score-mid-bg)] text-amber-900 ring-1 ring-amber-100",
  danger: "bg-[var(--score-poor-bg)] text-red-800 ring-1 ring-red-100",
} as const;

export type StatusBadgeVariant = keyof typeof variants;

import type { ReactNode } from "react";

export function StatusBadge({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: StatusBadgeVariant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
