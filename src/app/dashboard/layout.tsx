"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalizePlan, type Plan } from "@/lib/plan";
import DashboardNav from "@/components/dashboard/DashboardNav";

function UpgradeModal({ onClose }: { onClose: () => void }) {
  const waLink = `https://wa.me/90525788737?text=${encodeURIComponent(
    "Hi! I'm interested in upgrading my Genessa plan. Could you share the details?"
  )}`;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111827", border: "1px solid #1F2937",
          borderRadius: 16, padding: 32, maxWidth: 440, width: "100%",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#F9FAFB", margin: "0 0 8px" }}>
            Upgrade your plan
          </h2>
          <p style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 1.6, margin: 0 }}>
            Unlock advanced AI visibility features for your business.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div style={{ background: "#1F2937", border: "1px solid #374151", borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>Free</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#F9FAFB" }}>$0</div>
            <div style={{ fontSize: 10, color: "#6B7280", marginBottom: 8 }}>/month</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "left" as const }}>1 scan/mo<br/>Basic insights</div>
          </div>
          <div style={{ background: "#1F2937", border: "1px solid #3B82F6", borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#3B82F6", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>Starter</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#F9FAFB" }}>$29</div>
            <div style={{ fontSize: 10, color: "#6B7280", marginBottom: 8 }}>/month</div>
            <div style={{ fontSize: 11, color: "#D1D5DB", textAlign: "left" as const }}>2 scans/wk<br/>Full insights<br/>Scan history</div>
          </div>
          <div style={{ background: "#1F2937", border: "1px solid #8B5CF6", borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#8B5CF6", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>Pro</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#F9FAFB" }}>$79</div>
            <div style={{ fontSize: 10, color: "#6B7280", marginBottom: 8 }}>/month</div>
            <div style={{ fontSize: 11, color: "#D1D5DB", textAlign: "left" as const }}>4 scans/wk<br/>Growth Audit<br/>PDF Export</div>
          </div>
        </div>

        <p style={{ fontSize: 12, color: "#4B5563", textAlign: "center", marginBottom: 16 }}>
          Need 10+ domains or white-label?{" "}
          <a href="/contact" style={{ color: "#F59E0B", textDecoration: "none", fontWeight: 600 }}>Contact us for Agency →</a>
        </p>

        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block", width: "100%", padding: "12px 0", borderRadius: 8,
            background: "#25D366", color: "#fff", fontWeight: 600, fontSize: 14,
            textAlign: "center", textDecoration: "none", marginBottom: 8,
            boxSizing: "border-box" as const,
          }}
        >
          💬 Contact us on WhatsApp
        </a>
        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 8,
            background: "transparent", color: "#6B7280", fontWeight: 500, fontSize: 14,
            border: "1px solid #374151", cursor: "pointer",
            fontFamily: "var(--font-geist-sans)",
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<Plan>("free");
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState(false);
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
      {/* Upgrade modal */}
      {upgradeModal && <UpgradeModal onClose={() => setUpgradeModal(false)} />}

      {/* Desktop sidebar */}
      <div className="hidden md:block" style={{ flexShrink: 0 }}>
        <DashboardNav
          plan={plan}
          pathname={pathname ?? ""}
          email={email}
          onSignOut={handleSignOut}
          onUpgrade={() => setUpgradeModal(true)}
        />
      </div>

      {/* Mobile hamburger button */}
      <button
        className="md:hidden"
        onClick={() => setMenuOpen(true)}
        style={{
          position: "fixed", top: 16, left: 16, zIndex: 30,
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

      {/* Mobile overlay + sidebar — separated so z-indexes work correctly */}
      {menuOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.5)" }}
            onClick={() => setMenuOpen(false)}
          />
          <div style={{ position: "fixed", top: 0, left: 0, zIndex: 50 }}>
            <DashboardNav
              plan={plan}
              pathname={pathname ?? ""}
              email={email}
              onSignOut={async () => { setMenuOpen(false); await handleSignOut(); }}
              onUpgrade={() => { setMenuOpen(false); setUpgradeModal(true); }}
            />
          </div>
        </>
      )}

      {/* Main content */}
      <main style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
