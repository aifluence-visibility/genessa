"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import EngineScoresPanel from "@/components/dashboard/EngineScoresPanel";

const WA_TOUR = `https://wa.me/905325788737?text=${encodeURIComponent("Hi! I'd like to buy more AI visibility tour credits.")}`;

interface DashboardData {
  domain: string | null;
  credits: number;
  promptCount: number;
  approvedCount: number;
  competitorCount: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.replace("/auth/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("domain, organization_id")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (!profile?.organization_id) { router.replace("/onboarding"); return; }

      const orgId = profile.organization_id as string;
      const domain = (profile.domain as string | null) ?? null;

      const [orgRes, promptRes, compRes] = await Promise.all([
        supabase.from("organizations").select("extra_query_credits").eq("id", orgId).maybeSingle(),
        supabase.from("engine_prompts").select("id, is_user_approved").eq("organization_id", orgId),
        supabase.from("tracked_competitors").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
      ]);

      const credits = (orgRes.data?.extra_query_credits as number | null) ?? 0;
      const prompts = (promptRes.data ?? []) as { id: string; is_user_approved: boolean }[];
      const competitorCount = compRes.count ?? 0;

      setData({
        domain,
        credits,
        promptCount: prompts.length,
        approvedCount: prompts.filter((p) => p.is_user_approved).length,
        competitorCount,
      });
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #E5E7EB", borderTopColor: "#2952E3", animation: "spin 700ms linear infinite" }} />
      </div>
    );
  }

  if (!data) return null;

  const { domain, credits, promptCount, approvedCount, competitorCount } = data;

  return (
    <div style={{ padding: "36px 40px 80px", color: "#111827", maxWidth: 900 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
            AI Visibility Control Center
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", margin: 0, color: "#111827" }}>
            {domain ?? "Dashboard"}
          </h1>
        </div>

        {/* Credits badge */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 14px", borderRadius: 10,
            background: credits === 0 ? "#FFFBEB" : "#F0FDF4",
            border: `1px solid ${credits === 0 ? "#FDE68A" : "#BBF7D0"}`,
          }}>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em", color: credits === 0 ? "#92400E" : "#15803D" }}>
              {credits}
            </span>
            <span style={{ fontSize: 12, color: credits === 0 ? "#B45309" : "#166534" }}>
              tour credit{credits !== 1 ? "s" : ""}
            </span>
          </div>
          {credits === 0 && (
            <a href={WA_TOUR} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, fontWeight: 600, color: "#7C3AED", textDecoration: "none" }}>
              Buy a tour →
            </a>
          )}
        </div>
      </div>

      {/* ── V2 Engine Scores ── */}
      <EngineScoresPanel />

      {/* ── Summary cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>

        {/* Prompts */}
        <Link href="/dashboard/prompts" style={{ textDecoration: "none", color: "inherit" }}>
          <div
            style={{
              padding: "22px 24px", borderRadius: 14,
              background: "#fff", border: "1px solid #E5E7EB",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#A5B4FC")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Engine Prompts
              </div>
              <span style={{ fontSize: 14, color: "#9CA3AF" }}>→</span>
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.04em", color: "#111827", lineHeight: 1, marginBottom: 6 }}>
              {promptCount}
            </div>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
              {approvedCount} active · {promptCount - approvedCount} paused
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {[
                { label: "Claude",     color: "#D97706", bg: "#FEF3C7" },
                { label: "GPT-4o",    color: "#16A34A", bg: "#DCFCE7" },
                { label: "Perplexity",color: "#7C3AED", bg: "#F5F3FF" },
              ].map((e) => (
                <span key={e.label} style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                  color: e.color, background: e.bg,
                }}>
                  {e.label}
                </span>
              ))}
            </div>
          </div>
        </Link>

        {/* Competitors */}
        <Link href="/dashboard/competitors" style={{ textDecoration: "none", color: "inherit" }}>
          <div
            style={{
              padding: "22px 24px", borderRadius: 14,
              background: "#fff", border: "1px solid #E5E7EB",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#A5B4FC")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Tracked Competitors
              </div>
              <span style={{ fontSize: 14, color: "#9CA3AF" }}>→</span>
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.04em", color: "#111827", lineHeight: 1, marginBottom: 6 }}>
              {competitorCount}
            </div>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
              {competitorCount === 0
                ? "No competitors tracked yet"
                : `${competitorCount} brand${competitorCount !== 1 ? "s" : ""} in share-of-voice`}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
              color: "#6B7280", background: "#F3F4F6",
            }}>
              Share-of-voice comparison
            </span>
          </div>
        </Link>
      </div>

      {/* ── Credits exhausted CTA ── */}
      {credits === 0 && (
        <div style={{
          marginTop: 14, padding: "16px 20px", borderRadius: 12,
          background: "#FFFBEB", border: "1px solid #FDE68A",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#92400E", marginBottom: 3 }}>
              No credits — buy a tour to run fresh engine queries
            </div>
            <div style={{ fontSize: 12, color: "#B45309" }}>
              $49 one-time · Claude + GPT-4o + Perplexity · Credits added within 24h via WhatsApp
            </div>
          </div>
          <a
            href={WA_TOUR}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flexShrink: 0, fontSize: 12, fontWeight: 600,
              padding: "9px 18px", borderRadius: 9,
              background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
              color: "#fff", textDecoration: "none", whiteSpace: "nowrap",
            }}
          >
            Buy a tour →
          </a>
        </div>
      )}
    </div>
  );
}
