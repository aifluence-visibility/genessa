"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalizePlan, type Plan } from "@/lib/plan";
import DashboardNav from "@/components/dashboard/DashboardNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<Plan>("free");
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/auth/login");
        return;
      }
      setEmail(data.user.email ?? null);
      supabase
        .from("profiles")
        .select("plan")
        .eq("id", data.user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          setPlan(normalizePlan(profile?.plan as string));
        });
    });
  }, [router]);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8F9FC" }}>
      {/* Desktop sidebar */}
      <div className="hidden md:block" style={{ flexShrink: 0 }}>
        <DashboardNav
          plan={plan}
          pathname={pathname ?? ""}
          email={email}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Mobile hamburger button */}
      <button
        className="md:hidden"
        onClick={() => setMenuOpen(true)}
        style={{
          position: "fixed", top: 16, left: 16, zIndex: 50,
          width: 36, height: 36, borderRadius: 8,
          background: "#0F172A", border: "1px solid #1E293B",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {menuOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.5)" }}
          onClick={() => setMenuOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <DashboardNav
              plan={plan}
              pathname={pathname ?? ""}
              email={email}
              onSignOut={async () => { setMenuOpen(false); await handleSignOut(); }}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
