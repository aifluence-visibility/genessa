"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type PromptType = "category" | "solution" | "comparison" | "brand" | "long_tail";

interface EnginePrompt {
  id: string;
  prompt_text: string;
  prompt_type: PromptType;
  target_locale: string;
  target_engines: string[] | null;
  is_user_approved: boolean;
  is_active: boolean;
  created_at: string;
}

const TYPE_META: Record<PromptType, { label: string; color: string; bg: string }> = {
  category:   { label: "Category",    color: "#6366F1", bg: "#EEF2FF" },
  solution:   { label: "Solution",    color: "#10B981", bg: "#ECFDF5" },
  comparison: { label: "Comparison",  color: "#F59E0B", bg: "#FFFBEB" },
  brand:      { label: "Brand",       color: "#8B5CF6", bg: "#F5F3FF" },
  long_tail:  { label: "Long tail",   color: "#6B7280", bg: "#F9FAFB" },
};

const ENGINE_LABELS: Record<string, string> = {
  claude: "Claude",
  gpt: "GPT-4o",
  perplexity: "Perplexity",
};

const WA_CONTACT = `https://wa.me/905325788737?text=${encodeURIComponent("Hi! I'd like to add more prompts to my AI visibility monitoring.")}`;

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<EnginePrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
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
        .from("engine_prompts")
        .select("id, prompt_text, prompt_type, target_locale, target_engines, is_user_approved, is_active, created_at")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: true });

      setPrompts((data ?? []) as EnginePrompt[]);
      setLoading(false);
    })();
  }, [router]);

  async function toggleApproval(prompt: EnginePrompt) {
    if (saving[prompt.id]) return;
    setSaving((s) => ({ ...s, [prompt.id]: true }));

    const supabase = createSupabaseBrowserClient();
    const next = !prompt.is_user_approved;
    await supabase
      .from("engine_prompts")
      .update({ is_user_approved: next })
      .eq("id", prompt.id)
      .eq("organization_id", orgId!);

    setPrompts((ps) => ps.map((p) => p.id === prompt.id ? { ...p, is_user_approved: next } : p));
    setSaving((s) => ({ ...s, [prompt.id]: false }));
  }

  if (loading) return null;

  const locales = [...new Set(prompts.map((p) => p.target_locale))].sort();
  const approvedCount = prompts.filter((p) => p.is_user_approved && p.is_active).length;

  return (
    <div style={{ padding: "36px 40px 80px", color: "#111827", maxWidth: 760 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 6px" }}>
          Engine Prompts
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>
          These prompts are run through Claude, GPT-4o, and Perplexity to measure your AI visibility.
          Toggle approval to include or exclude individual prompts from future runs.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{
        display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" as const,
      }}>
        {[
          { label: "Total prompts", value: prompts.length },
          { label: "Active & approved", value: approvedCount, highlight: true },
          { label: "Locales", value: locales.join(", ") || "—" },
        ].map((stat) => (
          <div key={stat.label} style={{
            padding: "10px 16px", borderRadius: 10,
            background: stat.highlight ? "linear-gradient(135deg, rgba(41,82,227,0.06), rgba(123,63,228,0.06))" : "#F9FAFB",
            border: `1px solid ${stat.highlight ? "rgba(41,82,227,0.2)" : "#E5E7EB"}`,
          }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2 }}>{stat.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: stat.highlight ? "#2952E3" : "#111827" }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {prompts.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "40px 24px", borderRadius: 14,
          background: "#F9FAFB", border: "1px dashed #E5E7EB",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 6 }}>
            No prompts yet
          </div>
          <div style={{ fontSize: 13, color: "#6B7280" }}>
            Complete onboarding to generate your first set of AI visibility prompts.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {locales.map((locale) => {
            const localePrompts = prompts.filter((p) => p.target_locale === locale);
            return (
              <div key={locale}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em",
                  textTransform: "uppercase" as const, marginBottom: 8, marginTop: 8,
                  padding: "0 4px",
                }}>
                  {locale}
                </div>
                {localePrompts.map((prompt) => {
                  const meta = TYPE_META[prompt.prompt_type] ?? TYPE_META.long_tail;
                  const engines = (prompt.target_engines ?? ["claude", "gpt", "perplexity"]);
                  const isApproved = prompt.is_user_approved;
                  const isSaving = saving[prompt.id] ?? false;

                  return (
                    <div key={prompt.id} style={{
                      display: "flex", alignItems: "flex-start", gap: 14,
                      padding: "14px 16px", borderRadius: 12,
                      background: "#fff",
                      border: `1px solid ${isApproved ? "#E5E7EB" : "#F3F4F6"}`,
                      opacity: isApproved ? 1 : 0.55,
                      transition: "opacity 150ms, border-color 150ms",
                    }}>
                      {/* Toggle */}
                      <button
                        onClick={() => toggleApproval(prompt)}
                        disabled={isSaving}
                        title={isApproved ? "Disable this prompt" : "Enable this prompt"}
                        style={{
                          flexShrink: 0, marginTop: 1,
                          width: 20, height: 20, borderRadius: 6,
                          border: isApproved ? "2px solid #2952E3" : "2px solid #D1D5DB",
                          background: isApproved ? "#2952E3" : "transparent",
                          cursor: isSaving ? "wait" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "background 150ms, border-color 150ms",
                        }}
                      >
                        {isApproved && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>

                      {/* Prompt text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: "#111827", lineHeight: 1.5, marginBottom: 8 }}>
                          {prompt.prompt_text}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center",
                            padding: "2px 7px", borderRadius: 99, fontSize: 10, fontWeight: 600,
                            background: meta.bg, color: meta.color,
                          }}>
                            {meta.label}
                          </span>
                          {engines.map((e) => (
                            <span key={e} style={{
                              fontSize: 10, fontWeight: 500, color: "#6B7280",
                              padding: "1px 5px", borderRadius: 5,
                              background: "#F3F4F6",
                            }}>
                              {ENGINE_LABELS[e] ?? e}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Status badge */}
                      <div style={{ flexShrink: 0, marginTop: 1 }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center",
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                          padding: "2px 7px", borderRadius: 99,
                          background: isApproved ? "#DCFCE7" : "#F3F4F6",
                          color: isApproved ? "#15803D" : "#9CA3AF",
                        }}>
                          {isApproved ? "Active" : "Off"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Add more prompts CTA */}
      <div style={{
        marginTop: 24, padding: "16px 20px", borderRadius: 12,
        background: "#F9FAFB", border: "1px dashed #E5E7EB",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 3 }}>
            Want to track more queries?
          </div>
          <div style={{ fontSize: 12, color: "#9CA3AF" }}>
            Contact us via WhatsApp to add custom prompts to your monitoring set.
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
          Add prompts →
        </a>
      </div>
    </div>
  );
}
