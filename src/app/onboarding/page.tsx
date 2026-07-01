"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────────

type Locale = "tr-TR" | "en-US";
type Step = "domain" | "analyzing" | "review" | "confirming";
type PromptType = "category" | "solution" | "comparison" | "brand" | "long_tail";

interface Prompt {
  id: string;
  prompt_text: string;
  prompt_type: PromptType;
}

interface Competitor {
  id: string;
  competitor_name: string;
  competitor_url: string | null;
}

interface SetupResult {
  organization_id: string;
  business_info: {
    sector: string;
    brand_name: string;
    main_services: string[];
    target_audience: string;
  } | null;
  prompts: Prompt[];
  competitors: Competitor[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<PromptType, { label: string; color: string }> = {
  category:    { label: "Kategori",    color: "#6366f1" },
  solution:    { label: "Çözüm",       color: "#10b981" },
  comparison:  { label: "Karşılaştırma", color: "#f59e0b" },
  brand:       { label: "Marka",       color: "#8b5cf6" },
  long_tail:   { label: "Uzun kuyruk", color: "#6b7280" },
};

const LOCALE_LABELS: Record<Locale, string> = {
  "tr-TR": "Türkçe (tr-TR)",
  "en-US": "English (en-US)",
};

const ANALYZE_STEPS = [
  "Site taranıyor…",
  "Sektör analiz ediliyor…",
  "Sorgular oluşturuluyor…",
  "Rakipler belirleniyor…",
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function ProgressDots({ step }: { step: Step }) {
  const steps: Step[] = ["domain", "analyzing", "review", "confirming"];
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 36 }}>
      {steps.filter((s) => s !== "confirming").map((s, i) => (
        <div
          key={s}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: steps.indexOf(step) >= i ? "var(--genessa-blue)" : "var(--border-strong)",
            transition: "background 300ms",
          }}
        />
      ))}
    </div>
  );
}

function TypeBadge({ type }: { type: PromptType }) {
  const meta = TYPE_META[type];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 7px",
        borderRadius: 6,
        background: `${meta.color}18`,
        color: meta.color,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {meta.label}
    </span>
  );
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        width: 24,
        height: 24,
        borderRadius: 6,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: "var(--fg-3)",
        fontSize: 16,
        lineHeight: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      title="Kaldır"
    >
      ×
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("domain");
  const [domain, setDomain] = useState("");
  const [locale, setLocale] = useState<Locale>("tr-TR");
  const [error, setError] = useState<string | null>(null);

  // Setup results
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);

  // Add-new inputs
  const [newPromptText, setNewPromptText] = useState("");
  const [newCompetitorName, setNewCompetitorName] = useState("");
  const [newCompetitorUrl, setNewCompetitorUrl] = useState("");
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [showAddCompetitor, setShowAddCompetitor] = useState(false);

  // Analyzing animation
  const [analyzeIdx, setAnalyzeIdx] = useState(0);
  const analyzeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pre-fill domain from /score redirect
  useEffect(() => {
    const urlParam = searchParams.get("url") ?? searchParams.get("domain");
    if (urlParam) {
      setDomain(urlParam.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase());
    }
  }, [searchParams]);

  // Auth guard: if already onboarded, skip
  useEffect(() => {
    async function check() {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/auth/login"); return; }
      const { data } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.organization_id) router.replace("/dashboard");
    }
    check();
  }, [router]);

  // Analyzing step animation
  useEffect(() => {
    if (step === "analyzing") {
      setAnalyzeIdx(0);
      analyzeTimer.current = setInterval(() => {
        setAnalyzeIdx((i) => (i + 1) % ANALYZE_STEPS.length);
      }, 1400);
    } else {
      if (analyzeTimer.current) clearInterval(analyzeTimer.current);
    }
    return () => { if (analyzeTimer.current) clearInterval(analyzeTimer.current); };
  }, [step]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  async function handleAnalyze() {
    const d = domain.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();
    if (!d || !d.includes(".")) { setError("Geçerli bir domain girin (örn: site.com)"); return; }
    setError(null);
    setStep("analyzing");

    try {
      const res = await fetch("/api/onboarding/setup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain: d, locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "setup_failed");

      setSetupResult(data);
      setPrompts(data.prompts ?? []);
      setCompetitors(data.competitors ?? []);
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analiz başarısız, tekrar dene.");
      setStep("domain");
    }
  }

  async function handleConfirm() {
    if (!setupResult) return;
    setStep("confirming");

    const newP = newPromptText.trim()
      ? [{ prompt_text: newPromptText.trim(), prompt_type: "long_tail" as PromptType }]
      : [];
    const newC = newCompetitorName.trim()
      ? [{ competitor_name: newCompetitorName.trim(), competitor_url: newCompetitorUrl.trim() || null }]
      : [];

    try {
      const res = await fetch("/api/onboarding/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organization_id: setupResult.organization_id,
          domain: domain.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase(),
          sector: setupResult.business_info?.sector ?? "other",
          locale,
          kept_prompt_ids: prompts.map((p) => p.id),
          new_prompts: newP,
          kept_competitor_ids: competitors.map((c) => c.id),
          new_competitors: newC,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "confirm_failed");
      }
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi, tekrar dene.");
      setStep("review");
    }
  }

  function addPrompt() {
    if (!newPromptText.trim()) return;
    const tmp: Prompt = {
      id: `new-${Date.now()}`,
      prompt_text: newPromptText.trim(),
      prompt_type: "long_tail",
    };
    setPrompts((prev) => [...prev, tmp]);
    setNewPromptText("");
    setShowAddPrompt(false);
  }

  function addCompetitor() {
    if (!newCompetitorName.trim()) return;
    const tmp: Competitor = {
      id: `new-${Date.now()}`,
      competitor_name: newCompetitorName.trim(),
      competitor_url: newCompetitorUrl.trim() || null,
    };
    setCompetitors((prev) => [...prev, tmp]);
    setNewCompetitorName("");
    setNewCompetitorUrl("");
    setShowAddCompetitor(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const logoEl = (
    <div style={{ textAlign: "center", marginBottom: 40 }}>
      <span style={{
        fontSize: 22, fontWeight: 700, letterSpacing: "-0.04em",
        background: "var(--genessa-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>
        genessa
      </span>
    </div>
  );

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh", background: "var(--bg)", display: "flex",
    flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "40px 20px",
  };

  // Step 1: Domain + locale
  if (step === "domain") {
    return (
      <main style={containerStyle}>
        {logoEl}
        <div style={{ width: "100%", maxWidth: 520 }}>
          <ProgressDots step={step} />
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Adım 1 / 3</div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--fg)", margin: "0 0 10px" }}>
              Sitenizi girin
            </h1>
            <p style={{ fontSize: 14, color: "var(--fg-3)", margin: 0 }}>
              ChatGPT, Claude ve Perplexity'de sizi nasıl gördüklerini ölçelim.
            </p>
          </div>

          {/* Domain input */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-2)", display: "block", marginBottom: 6 }}>
              Domain
            </label>
            <input
              type="text"
              placeholder="site.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 12,
                border: "1.5px solid var(--border)", background: "var(--bg)",
                color: "var(--fg)", fontSize: 15, fontFamily: "var(--font-geist-sans)",
                boxSizing: "border-box", outline: "none",
              }}
            />
          </div>

          {/* Locale selector */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-2)", display: "block", marginBottom: 6 }}>
              Hedef pazar / dil
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {(["tr-TR", "en-US"] as Locale[]).map((loc) => (
                <button
                  key={loc}
                  onClick={() => setLocale(loc)}
                  style={{
                    padding: "12px 16px", borderRadius: 12, textAlign: "left", cursor: "pointer",
                    border: locale === loc ? "2px solid var(--genessa-blue)" : "2px solid var(--border)",
                    background: locale === loc ? "rgba(99,102,241,0.06)" : "var(--bg)",
                    color: locale === loc ? "var(--genessa-blue)" : "var(--fg)",
                    fontSize: 14, fontWeight: 600, fontFamily: "var(--font-geist-sans)",
                    boxShadow: locale === loc ? "var(--shadow-glow)" : "none",
                    transition: "all 150ms ease",
                  }}
                >
                  {LOCALE_LABELS[loc]}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "var(--fg-3)", margin: "8px 0 0" }}>
              Diğer pazarlar (Arapça, Urduca vb.) için{" "}
              <a href="/contact" style={{ color: "var(--genessa-blue)", textDecoration: "none" }}>özel talep</a> oluşturun.
            </p>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "var(--score-bad)", textAlign: "center", marginBottom: 14 }}>
              {error}
            </p>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!domain.trim()}
            style={{
              width: "100%", padding: "14px 20px", borderRadius: 12, border: "none",
              background: domain.trim() ? "var(--genessa-gradient)" : "var(--border-strong)",
              color: domain.trim() ? "#fff" : "var(--fg-3)",
              fontSize: 15, fontWeight: 600, cursor: domain.trim() ? "pointer" : "not-allowed",
              boxShadow: domain.trim() ? "var(--shadow-glow)" : "none",
              fontFamily: "var(--font-geist-sans)",
              transition: "background 200ms ease, box-shadow 200ms ease",
            }}
          >
            Analizi Başlat →
          </button>
        </div>
      </main>
    );
  }

  // Step 2: Analyzing
  if (step === "analyzing") {
    return (
      <main style={containerStyle}>
        {logoEl}
        <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
          <ProgressDots step={step} />
          <div style={{
            width: 48, height: 48, borderRadius: "50%", margin: "0 auto 24px",
            border: "3px solid var(--border)", borderTopColor: "var(--genessa-blue)",
            animation: "spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            {domain} analiz ediliyor
          </h2>
          <p style={{ fontSize: 14, color: "var(--fg-3)", margin: 0, minHeight: 20, transition: "opacity 200ms" }}>
            {ANALYZE_STEPS[analyzeIdx]}
          </p>
        </div>
      </main>
    );
  }

  // Step 3: Review
  if (step === "review" && setupResult) {
    const bi = setupResult.business_info;
    return (
      <main style={{ ...containerStyle, justifyContent: "flex-start", paddingTop: 60 }}>
        {logoEl}
        <div style={{ width: "100%", maxWidth: 640 }}>
          <ProgressDots step={step} />
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Adım 2 / 3</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--fg)", margin: "0 0 8px" }}>
              Takip listesini inceleyin
            </h1>
            {bi && (
              <p style={{ fontSize: 13, color: "var(--fg-3)", margin: 0 }}>
                <strong style={{ color: "var(--fg-2)" }}>{bi.brand_name}</strong>
                {" · "}{bi.main_services.slice(0, 2).join(", ")}
                {" · "}{bi.target_audience}
              </p>
            )}
          </div>

          {/* Prompts */}
          <section style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--fg-2)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Sorgular ({prompts.length})
              </h2>
              <button
                onClick={() => setShowAddPrompt(true)}
                style={{
                  fontSize: 12, fontWeight: 600, color: "var(--genessa-blue)", background: "none",
                  border: "none", cursor: "pointer", padding: "4px 8px",
                }}
              >
                + Ekle
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {prompts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                    borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg)",
                  }}
                >
                  <TypeBadge type={p.prompt_type} />
                  <span style={{ flex: 1, fontSize: 13, color: "var(--fg)", lineHeight: 1.4 }}>
                    {p.prompt_text}
                  </span>
                  <DeleteBtn onClick={() => setPrompts((prev) => prev.filter((x) => x.id !== p.id))} />
                </div>
              ))}
            </div>

            {showAddPrompt && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input
                  autoFocus
                  type="text"
                  placeholder="Yeni sorgu…"
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPrompt()}
                  style={{
                    flex: 1, padding: "9px 12px", borderRadius: 10, fontSize: 13,
                    border: "1.5px solid var(--genessa-blue)", background: "var(--bg)",
                    color: "var(--fg)", fontFamily: "var(--font-geist-sans)", outline: "none",
                  }}
                />
                <button onClick={addPrompt} style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: "var(--genessa-blue)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-geist-sans)" }}>Ekle</button>
                <button onClick={() => setShowAddPrompt(false)} style={{ padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "none", color: "var(--fg-3)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-geist-sans)" }}>İptal</button>
              </div>
            )}
          </section>

          {/* Competitors */}
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--fg-2)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Rakipler ({competitors.length})
              </h2>
              <button
                onClick={() => setShowAddCompetitor(true)}
                style={{ fontSize: 12, fontWeight: 600, color: "var(--genessa-blue)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
              >
                + Ekle
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {competitors.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                    borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg)",
                  }}
                >
                  <span style={{ flex: 1, fontSize: 13, color: "var(--fg)" }}>
                    {c.competitor_name}
                    {c.competitor_url && (
                      <span style={{ marginLeft: 8, fontSize: 11, color: "var(--fg-3)" }}>{c.competitor_url}</span>
                    )}
                  </span>
                  <DeleteBtn onClick={() => setCompetitors((prev) => prev.filter((x) => x.id !== c.id))} />
                </div>
              ))}
            </div>

            {showAddCompetitor && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Rakip adı…"
                    value={newCompetitorName}
                    onChange={(e) => setNewCompetitorName(e.target.value)}
                    style={{
                      flex: 1, padding: "9px 12px", borderRadius: 10, fontSize: 13,
                      border: "1.5px solid var(--genessa-blue)", background: "var(--bg)",
                      color: "var(--fg)", fontFamily: "var(--font-geist-sans)", outline: "none",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="domain.com (isteğe bağlı)"
                    value={newCompetitorUrl}
                    onChange={(e) => setNewCompetitorUrl(e.target.value)}
                    style={{
                      flex: 1, padding: "9px 12px", borderRadius: 10, fontSize: 13,
                      border: "1.5px solid var(--border)", background: "var(--bg)",
                      color: "var(--fg)", fontFamily: "var(--font-geist-sans)", outline: "none",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={addCompetitor} style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: "var(--genessa-blue)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-geist-sans)" }}>Ekle</button>
                  <button onClick={() => setShowAddCompetitor(false)} style={{ padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "none", color: "var(--fg-3)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-geist-sans)" }}>İptal</button>
                </div>
              </div>
            )}
          </section>

          {error && (
            <p style={{ fontSize: 13, color: "var(--score-bad)", textAlign: "center", marginBottom: 14 }}>
              {error}
            </p>
          )}

          <button
            onClick={handleConfirm}
            disabled={prompts.length === 0}
            style={{
              width: "100%", padding: "14px 20px", borderRadius: 12, border: "none",
              background: prompts.length > 0 ? "var(--genessa-gradient)" : "var(--border-strong)",
              color: prompts.length > 0 ? "#fff" : "var(--fg-3)",
              fontSize: 15, fontWeight: 600,
              cursor: prompts.length > 0 ? "pointer" : "not-allowed",
              boxShadow: prompts.length > 0 ? "var(--shadow-glow)" : "none",
              fontFamily: "var(--font-geist-sans)",
              transition: "background 200ms ease",
            }}
          >
            Onayla & Dashboard'a Geç →
          </button>
        </div>
      </main>
    );
  }

  // Step: confirming (brief loading before redirect)
  return (
    <main style={containerStyle}>
      {logoEl}
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%", margin: "0 auto 24px",
          border: "3px solid var(--border)", borderTopColor: "var(--genessa-blue)",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: 15, color: "var(--fg-2)", margin: 0 }}>Kaydediliyor…</p>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
      <OnboardingContent />
    </Suspense>
  );
}
