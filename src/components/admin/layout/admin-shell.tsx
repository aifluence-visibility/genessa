"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { AdminSidebar } from "@/components/admin/layout/admin-sidebar";
import { AdminHeader } from "@/components/admin/layout/admin-header";

export function AdminShell({
  children,
  databaseEnvReady,
  authEnabled = false,
  userEmail = null,
}: {
  children: ReactNode;
  databaseEnvReady: boolean;
  /** When true, `/admin` requires Supabase Auth + `public.users.auth_user_id` link. */
  authEnabled?: boolean;
  userEmail?: string | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-full bg-[var(--ink-50)] text-[var(--ink-800)]">
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[var(--ink-900)]/40 backdrop-blur-[2px] lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar onNavigate={() => setMobileOpen(false)} className="h-full shadow-[var(--shadow-lg)]" />
      </div>

      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <AdminHeader
          onOpenSidebar={() => setMobileOpen(true)}
          authEnabled={authEnabled}
          userEmail={userEmail}
        />
        {!databaseEnvReady ? (
          <div
            className="border-b border-amber-200/80 bg-amber-50 px-4 py-2.5 text-[13px] leading-relaxed text-amber-950 sm:px-6"
            role="status"
          >
            <span className="font-semibold">Database env not configured.</span>{" "}
            Set <code className="rounded bg-amber-100/80 px-1 py-0.5 font-mono text-[12px]">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            and <code className="rounded bg-amber-100/80 px-1 py-0.5 font-mono text-[12px]">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            on the server. Add{" "}
            <code className="rounded bg-amber-100/80 px-1 py-0.5 font-mono text-[12px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
            to enable admin sign-in and RLS-backed reads. Until URL + service key exist, admin pages use mock data.
          </div>
        ) : null}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
