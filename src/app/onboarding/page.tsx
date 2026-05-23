"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Sector {
  key: string;
  emoji: string;
  name: string;
  description: string;
}

const SECTORS: Sector[] = [
  { key: "restaurant", emoji: "🍽️", name: "Restaurant & Café",       description: "Yerel görünürlük ve rezervasyon" },
  { key: "clinic",     emoji: "🏥", name: "Clinic & Wellness",        description: "Güven sinyalleri ve hasta edinimi" },
  { key: "saas",       emoji: "💻", name: "SaaS & Tech",              description: "AI citation ve karşılaştırma görünürlüğü" },
  { key: "hotel",      emoji: "🏨", name: "Hotel & Hospitality",      description: "Direkt rezervasyon ve OTA görünürlüğü" },
  { key: "creator",    emoji: "🎨", name: "Creator & Personal Brand", description: "Düşünce liderliği ve platform varlığı" },
  { key: "legal",      emoji: "⚖️", name: "Legal & Finance",          description: "E-E-A-T sinyalleri ve otorite" },
  { key: "ecommerce",  emoji: "🛒", name: "E-Commerce",               description: "Ürün şeması ve AI alışveriş görünürlüğü" },
  { key: "other",      emoji: "🔧", name: "Other",                    description: "Genel AI görünürlük stratejisi" },
];

export default function Onboarding() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkSector() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace("/auth/login"); return; }

        const { data } = await supabase
          .from("profiles")
          .select("sector")
          .eq("id", user.id)
          .maybeSingle();

        if (data?.sector) {
          router.replace("/dashboard");
          return;
        }
      } catch {
        // proceed to onboarding
      } finally {
        setChecking(false);
      }
    }
    checkSector();
  }, [router]);

  async function handleContinue() {
    if (!selected || saving) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }

      const { error: dbError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, sector: selected }, { onConflict: "id" });

      if (dbError) throw dbError;
      router.push("/dashboard");
    } catch {
      setError("Kaydedilemedi, lütfen tekrar dene.");
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
        }}
      />
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <span
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            background: "var(--genessa-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          genessa
        </span>
      </div>

      <div style={{ width: "100%", maxWidth: 640 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            className="eyebrow"
            style={{ marginBottom: 10 }}
          >
            Adım 1 / 1
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--fg)",
              margin: "0 0 10px",
            }}
          >
            Sektörünüzü seçin
          </h1>
          <p style={{ fontSize: 14, color: "var(--fg-3)", margin: 0 }}>
            AI görünürlük analizinizi sektörünüze özel hale getirelim.
          </p>
        </div>

        {/* Sector grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
            marginBottom: 28,
          }}
        >
          {SECTORS.map((s) => {
            const isSelected = selected === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSelected(s.key)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "16px 18px",
                  borderRadius: 14,
                  border: isSelected
                    ? "2px solid var(--genessa-blue)"
                    : "2px solid var(--border)",
                  background: isSelected ? "rgba(99,102,241,0.06)" : "var(--bg)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "border-color 150ms ease, background 150ms ease, box-shadow 150ms ease",
                  boxShadow: isSelected ? "var(--shadow-glow)" : "none",
                  width: "100%",
                }}
              >
                <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>
                  {s.emoji}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: isSelected ? "var(--genessa-blue)" : "var(--fg)",
                      marginBottom: 3,
                    }}
                  >
                    {s.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.4 }}>
                    {s.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <p style={{ fontSize: 13, color: "var(--score-bad)", textAlign: "center", marginBottom: 14 }}>
            {error}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={handleContinue}
          disabled={!selected || saving}
          style={{
            width: "100%",
            padding: "14px 20px",
            borderRadius: 12,
            border: "none",
            background: selected ? "var(--genessa-gradient)" : "var(--border-strong)",
            color: selected ? "#fff" : "var(--fg-3)",
            fontSize: 15,
            fontWeight: 600,
            cursor: selected && !saving ? "pointer" : "not-allowed",
            boxShadow: selected ? "var(--shadow-glow)" : "none",
            transition: "background 200ms ease, box-shadow 200ms ease",
            fontFamily: "var(--font-geist-sans)",
          }}
        >
          {saving ? "Kaydediliyor…" : "Devam Et →"}
        </button>
      </div>
    </main>
  );
}
