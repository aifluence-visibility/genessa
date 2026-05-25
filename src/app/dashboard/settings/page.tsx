"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalizePlan, getPlanLabel, getPlanColor, type Plan } from "@/lib/plan";

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace("/auth/login"); return; }
      setEmail(data.user.email ?? null);
      supabase
        .from("profiles")
        .select("plan")
        .eq("id", data.user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          setPlan(normalizePlan(profile?.plan as string));
          setReady(true);
        });
    });
  }, [router]);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  if (!ready) return null;

  const planColor = getPlanColor(plan);
  const planLabel = getPlanLabel(plan);

  return (
    <div style={{ padding: "36px 40px 80px", color: "#111827", maxWidth: 600 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 6px" }}>
          ⚙️ Settings
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
          Manage your account and preferences.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Account info */}
        <div style={{
          padding: "20px 24px", borderRadius: 14,
          background: "#fff", border: "1px solid #E5E7EB",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            Account
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>Email</div>
            <div style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>{email ?? "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>Plan</div>
            <span style={{
              display: "inline-flex", alignItems: "center",
              padding: "3px 10px", borderRadius: 20,
              fontSize: 12, fontWeight: 600,
              background: planColor + "22", color: planColor,
              border: `1px solid ${planColor}44`,
            }}>
              {planLabel}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          padding: "20px 24px", borderRadius: 14,
          background: "#fff", border: "1px solid #E5E7EB",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            Actions
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link
              href="/onboarding"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 16px", borderRadius: 9,
                background: "#F8F9FC", border: "1px solid #E5E7EB",
                color: "#374151", fontSize: 13, fontWeight: 500,
                textDecoration: "none",
              }}
            >
              <span>Change sector</span>
              <span style={{ color: "#9CA3AF", fontSize: 16 }}>→</span>
            </Link>
            <Link
              href="/dashboard/upgrade"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 16px", borderRadius: 9,
                background: "#EFF6FF", border: "1px solid #BFDBFE",
                color: "#2952E3", fontSize: 13, fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <span>Upgrade plan</span>
              <span style={{ fontSize: 16 }}>→</span>
            </Link>
            <button
              onClick={handleSignOut}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "10px 16px", borderRadius: 9,
                background: "#FEF2F2", border: "1px solid #FECACA",
                color: "#EF4444", fontSize: 13, fontWeight: 500,
                cursor: "pointer", fontFamily: "var(--font-geist-sans)",
              }}
            >
              <span>Sign out</span>
              <span style={{ fontSize: 16 }}>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
