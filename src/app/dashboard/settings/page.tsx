"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalizePlan, getPlanLabel, getPlanColor, type Plan } from "@/lib/plan";

const SECTORS = [
  { key: "restaurant", emoji: "🍽️", name: "Restaurant & Café" },
  { key: "clinic",     emoji: "🏥", name: "Clinic & Wellness" },
  { key: "saas",       emoji: "💻", name: "SaaS & Tech" },
  { key: "hotel",      emoji: "🏨", name: "Hotel & Hospitality" },
  { key: "creator",    emoji: "🎨", name: "Creator & Personal Brand" },
  { key: "legal",      emoji: "⚖️", name: "Legal & Finance" },
  { key: "ecommerce",  emoji: "🛒", name: "E-Commerce" },
  { key: "other",      emoji: "🔧", name: "Other" },
];

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [sector, setSector] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [sectorSaving, setSectorSaving] = useState(false);
  const [sectorSaved, setSectorSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace("/auth/login"); return; }
      setEmail(data.user.email ?? null);
      setUserId(data.user.id);
      supabase
        .from("profiles")
        .select("plan, sector")
        .eq("id", data.user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          setPlan(normalizePlan(profile?.plan as string));
          setSector((profile?.sector as string | null) ?? null);
          setReady(true);
        });
    });
  }, [router]);

  async function handleSectorSelect(key: string) {
    if (!userId || sectorSaving) return;
    setSectorSaving(true);
    setSectorSaved(false);
    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("profiles")
      .upsert({ id: userId, sector: key }, { onConflict: "id" });
    setSector(key);
    setSectorSaving(false);
    setSectorSaved(true);
    setTimeout(() => setSectorSaved(false), 2500);
  }

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  if (!ready) return null;

  const planColor = getPlanColor(plan);
  const planLabel = getPlanLabel(plan);

  return (
    <div style={{ padding: "36px 40px 80px", color: "#111827", maxWidth: 640 }}>
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
          <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 14 }}>
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

        {/* Sector selection */}
        <div style={{
          padding: "20px 24px", borderRadius: 14,
          background: "#fff", border: "1px solid #E5E7EB",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
              Sector
            </div>
            {sectorSaved && (
              <span style={{ fontSize: 12, fontWeight: 600, color: "#16A34A" }}>
                ✅ Sector updated
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 16px", lineHeight: 1.5 }}>
            Choose your sector to get personalised AI visibility analysis.
          </p>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8,
            opacity: sectorSaving ? 0.6 : 1, transition: "opacity 150ms",
          }}>
            {SECTORS.map((s) => {
              const isSelected = sector === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => handleSectorSelect(s.key)}
                  disabled={sectorSaving}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    padding: "12px 8px", borderRadius: 10, gap: 6,
                    border: isSelected ? "2px solid #2952E3" : "2px solid #E5E7EB",
                    background: isSelected ? "rgba(41,82,227,0.06)" : "#F9FAFB",
                    cursor: sectorSaving ? "wait" : "pointer",
                    fontFamily: "var(--font-geist-sans)",
                    transition: "border-color 150ms, background 150ms",
                    boxShadow: isSelected ? "0 0 0 3px rgba(41,82,227,0.07)" : "none",
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{s.emoji}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, textAlign: "center", lineHeight: 1.3,
                    color: isSelected ? "#2952E3" : "#374151",
                  }}>
                    {s.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{
          padding: "20px 24px", borderRadius: 14,
          background: "#fff", border: "1px solid #E5E7EB",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 14 }}>
            Actions
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
