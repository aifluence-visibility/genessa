"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Competitor {
  id: string;
  competitor_name: string;
  competitor_url: string | null;
  created_at: string;
}

const WA_CONTACT = `https://wa.me/905325788737?text=${encodeURIComponent("Hi! I'd like to update my competitor tracking list.")}`;

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) { router.replace("/auth/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (!profile?.organization_id) { router.replace("/onboarding"); return; }
      setOrgId(profile.organization_id as string);

      const { data } = await supabase
        .from("tracked_competitors")
        .select("id, competitor_name, competitor_url, created_at")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: true });

      setCompetitors((data ?? []) as Competitor[]);
      setLoading(false);
    })();
  }, [router]);

  if (loading) return null;
  void orgId;

  return (
    <div style={{ padding: "36px 40px 80px", color: "#111827", maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 6px" }}>
          Tracked Competitors
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
          These brands are monitored alongside yours in every AI engine run.
          Share-of-voice scores are calculated relative to this list.
        </p>
      </div>

      {competitors.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "40px 24px", borderRadius: 14,
          background: "#F9FAFB", border: "1px dashed #E5E7EB",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏁</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 6 }}>
            No competitors tracked yet
          </div>
          <div style={{ fontSize: 13, color: "#6B7280" }}>
            Competitors are added during onboarding. Contact us to update your list.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {competitors.map((c, i) => (
            <div key={c.id} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 18px", borderRadius: 12,
              background: "#fff", border: "1px solid #E5E7EB",
            }}>
              {/* Rank */}
              <div style={{
                flexShrink: 0, width: 28, height: 28, borderRadius: 8,
                background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "#6B7280",
              }}>
                {i + 1}
              </div>

              {/* Name + URL */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{c.competitor_name}</div>
                {c.competitor_url && (
                  <a
                    href={c.competitor_url.startsWith("http") ? c.competitor_url : `https://${c.competitor_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 12, color: "#6B7280", textDecoration: "none",
                      fontFamily: "var(--font-geist-mono)",
                    }}
                  >
                    {c.competitor_url}
                  </a>
                )}
              </div>

              {/* Added date */}
              <div style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>
                {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update CTA */}
      <div style={{
        marginTop: 24, padding: "16px 20px", borderRadius: 12,
        background: "#F9FAFB", border: "1px dashed #E5E7EB",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 3 }}>
            Need to update your competitor list?
          </div>
          <div style={{ fontSize: 12, color: "#9CA3AF" }}>
            Contact us via WhatsApp — changes take effect in the next engine run.
          </div>
        </div>
        <a
          href={WA_CONTACT}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flexShrink: 0, fontSize: 12, fontWeight: 600,
            padding: "8px 16px", borderRadius: 8,
            background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
            color: "#fff", textDecoration: "none", whiteSpace: "nowrap",
          }}
        >
          Update list →
        </a>
      </div>
    </div>
  );
}
