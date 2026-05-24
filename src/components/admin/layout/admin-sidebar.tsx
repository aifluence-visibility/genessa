"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavItems } from "@/lib/admin/navigation";
import { AdminNavIconGlyph } from "@/components/admin/icons";

export function AdminSidebar({
  onNavigate,
  className = "",
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={`flex h-full w-[260px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--ink-0)] ${className}`}
    >
      <div className="flex h-14 items-center gap-2 border-b border-[var(--border)] px-4">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ink-0)] shadow-[var(--shadow-sm)]"
          style={{ background: "var(--genessa-gradient)" }}
          aria-hidden
        >
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="6" fill="currentColor" />
            <path
              d="M16 6v4M16 22v4M6 16h4M22 16h4M9 9l2.8 2.8M20.2 20.2L23 23M9 23l2.8-2.8M20.2 11.8L23 9"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.85"
            />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-[var(--ink-800)]">Genessa</p>
          <p className="truncate text-xs text-[var(--ink-500)]">Internal Admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Primary">
        {adminNavItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center gap-2.5 rounded-[var(--r-md)] px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--ink-100)] text-[var(--ink-900)] ring-1 ring-[var(--border)]"
                  : "text-[var(--ink-600)] hover:bg-[var(--ink-50)] hover:text-[var(--ink-800)]"
              }`}
            >
              <span
                className={
                  active
                    ? "text-[var(--genessa-blue)]"
                    : "text-[var(--ink-400)] group-hover:text-[var(--genessa-blue)]"
                }
              >
                <AdminNavIconGlyph name={item.icon} />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
