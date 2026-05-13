"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavItems } from "@/lib/admin/navigation";
import { signOutAdmin } from "@/app/admin/login/actions";

function titleFromPath(pathname: string | null): { title: string; description?: string } {
  if (!pathname) return { title: "Admin" };
  if (pathname === "/admin" || pathname === "/admin/dashboard") {
    return {
      title: "Dashboard",
      description: "Operational snapshot across clients, audits, and approvals.",
    };
  }
  const match = adminNavItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  if (match) {
    return {
      title: match.label,
      description: undefined,
    };
  }
  return { title: "Admin" };
}

export function AdminHeader({
  onOpenSidebar,
  authEnabled = false,
  userEmail = null,
}: {
  onOpenSidebar: () => void;
  authEnabled?: boolean;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const { title, description } = titleFromPath(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--ink-0)_88%,transparent)] px-4 backdrop-blur-md supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--ink-0)_72%,transparent)] sm:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] text-[var(--ink-700)] shadow-[var(--shadow-xs)] hover:bg-[var(--ink-50)] lg:hidden"
        aria-label="Open navigation"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2 className="truncate text-sm font-semibold tracking-tight text-[var(--ink-900)] sm:text-base">{title}</h2>
          <span className="hidden text-[var(--ink-300)] sm:inline">/</span>
          <Link
            href="/"
            className="hidden text-xs font-medium text-[var(--genessa-blue)] hover:text-[var(--accent-hover)] sm:inline"
          >
            View marketing site
          </Link>
        </div>
        {description ? <p className="mt-0.5 hidden text-xs text-[var(--ink-500)] sm:block">{description}</p> : null}
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        {authEnabled && userEmail ? (
          <>
            <span
              className="max-w-[200px] truncate rounded-full bg-[var(--ink-100)] px-2.5 py-1 text-xs font-medium text-[var(--ink-600)] ring-1 ring-[var(--border)]"
              title={userEmail}
            >
              {userEmail}
            </span>
            <form action={signOutAdmin}>
              <button
                type="submit"
                className="rounded-full border border-[var(--border)] bg-[var(--ink-0)] px-2.5 py-1 text-xs font-medium text-[var(--ink-700)] hover:bg-[var(--ink-50)]"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <span className="rounded-full bg-[var(--ink-100)] px-2.5 py-1 text-xs font-medium text-[var(--ink-600)] ring-1 ring-[var(--border)]">
            Team · Internal
          </span>
        )}
      </div>
    </header>
  );
}
