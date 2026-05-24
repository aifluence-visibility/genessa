"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Plan } from "@/lib/plan";

const SECTORS = [
  { key: "restaurant", emoji: "🍽️", label: "Restaurant" },
  { key: "clinic",     emoji: "🏥", label: "Clinic" },
  { key: "saas",       emoji: "💻", label: "SaaS" },
  { key: "hotel",      emoji: "🏨", label: "Hotel" },
  { key: "creator",    emoji: "🎨", label: "Creator" },
  { key: "legal",      emoji: "⚖️", label: "Legal" },
  { key: "ecommerce",  emoji: "🛒", label: "E-Commerce" },
  { key: "other",      emoji: "🔧", label: "Other" },
];

function sectorEmoji(key: string | null | undefined): string {
  return SECTORS.find((s) => s.key === key)?.emoji ?? "🔧";
}

function sectorLabel(key: string | null | undefined): string {
  return SECTORS.find((s) => s.key === key)?.label ?? "Other";
}

function scoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return "#9CA3AF";
  if (score <= 40) return "#DC2626";
  if (score <= 70) return "#D97706";
  return "#16A34A";
}

function scoreBg(score: number | null | undefined): string {
  if (score === null || score === undefined) return "#F3F4F6";
  if (score <= 40) return "#FEF2F2";
  if (score <= 70) return "#FFFBEB";
  return "#F0FDF4";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type AgencyDomain = {
  id: string;
  domain: string;
  sector: string | null;
  nickname: string | null;
  created_at: string;
  lastScan?: {
    readiness_score: number | null;
    authority_score: number | null;
    influence_score: number | null;
    created_at: string;
  } | null;
};

function ScorePill({ score }: { score: number | null | undefined }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: scoreBg(score),
        color: scoreColor(score),
        fontFamily: "var(--font-geist-mono)",
        minWidth: 32,
        textAlign: "center",
      }}
    >
      {score !== null && score !== undefined ? score : "—"}
    </span>
  );
}

function UpgradeWall() {
  const whatsappMessage = encodeURIComponent(
    `Merhaba, Genessa Agency planına geçmek istiyorum. Çoklu domain yönetimi hakkında bilgi alabilir miyim?`
  );
  const whatsappUrl = `https://wa.me/90525788737?text=${whatsappMessage}`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8F9FC",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#111827",
          border: "1px solid #1F2937",
          borderRadius: 20,
          padding: "40px 36px",
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#F9FAFB",
            margin: "0 0 10px",
            letterSpacing: "-0.025em",
          }}
        >
          Agency Dashboard
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#9CA3AF",
            lineHeight: 1.65,
            margin: "0 0 28px",
          }}
        >
          10 domain yönetimi, karşılaştırma tablosu ve white-label raporlar
          Agency planına dahildir.
        </p>

        <div
          style={{
            background: "#1F2937",
            border: "1px solid #374151",
            borderRadius: 14,
            padding: "20px 20px 16px",
            marginBottom: 24,
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#F59E0B",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}
          >
            Agency — $149/ay
          </div>
          {[
            "✓ 10 domain yönetimi",
            "✓ Karşılaştırma tablosu",
            "✓ White-label raporlar",
            "✓ Growth Audit & PDF Export",
            "✓ Öncelikli destek",
          ].map((f) => (
            <div
              key={f}
              style={{ fontSize: 13, color: "#D1D5DB", marginBottom: 6 }}
            >
              {f}
            </div>
          ))}
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            width: "100%",
            padding: "13px 0",
            borderRadius: 10,
            background: "#25D366",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
            textAlign: "center",
            textDecoration: "none",
            marginBottom: 10,
            boxSizing: "border-box",
          }}
        >
          💬 WhatsApp ile İletişime Geç
        </a>
        <Link
          href="/dashboard"
          style={{
            display: "block",
            textAlign: "center",
            fontSize: 13,
            color: "#6B7280",
            textDecoration: "none",
            padding: "8px 0",
          }}
        >
          ← Dashboard&apos;a Dön
        </Link>
      </div>
    </div>
  );
}

export default function AgencyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<AgencyDomain[]>([]);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState("");
  const [newSector, setNewSector] = useState("other");
  const [newNickname, setNewNickname] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/auth/login");
        return;
      }
      setUser(data.user);
    });
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const supabase = createSupabaseBrowserClient();
    supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setPlan((data?.plan as Plan) ?? "free");
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!user || loading) return;
    if (plan !== "agency") return;
    loadDomains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, plan, loading]);

  async function loadDomains() {
    if (!user) return;
    const supabase = createSupabaseBrowserClient();

    const { data: domainRows } = await supabase
      .from("agency_domains")
      .select("id, domain, sector, nickname, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (!domainRows || domainRows.length === 0) {
      setDomains([]);
      return;
    }

    const domainNames = domainRows.map((r) => r.domain as string);

    const { data: scanRows } = await supabase
      .from("scans")
      .select("domain, readiness_score, authority_score, influence_score, created_at")
      .eq("user_id", user.id)
      .in("domain", domainNames)
      .order("created_at", { ascending: false })
      .limit(200);

    const latestScan: Record<
      string,
      {
        readiness_score: number | null;
        authority_score: number | null;
        influence_score: number | null;
        created_at: string;
      }
    > = {};

    for (const s of scanRows ?? []) {
      const d = s.domain as string;
      if (!latestScan[d]) {
        latestScan[d] = {
          readiness_score: s.readiness_score as number | null,
          authority_score: s.authority_score as number | null,
          influence_score: s.influence_score as number | null,
          created_at: s.created_at as string,
        };
      }
    }

    setDomains(
      domainRows.map((r) => ({
        id: r.id as string,
        domain: r.domain as string,
        sector: r.sector as string | null,
        nickname: r.nickname as string | null,
        created_at: r.created_at as string,
        lastScan: latestScan[r.domain as string] ?? null,
      }))
    );
  }

  async function handleAddDomain() {
    if (!user || saving) return;
    const trimmed = newDomain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!trimmed) return;
    if (domains.length >= 10) return;

    setSaving(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("agency_domains").insert({
      user_id: user.id,
      domain: trimmed,
      sector: newSector || "other",
      nickname: newNickname.trim() || null,
    });

    if (!error) {
      setNewDomain("");
      setNewSector("other");
      setNewNickname("");
      setAdding(false);
      await loadDomains();
    }
    setSaving(false);
  }

  async function handleRemoveDomain(id: string) {
    if (!user || removing) return;
    setRemoving(id);
    const supabase = createSupabaseBrowserClient();
    await supabase.from("agency_domains").delete().eq("id", id);
    setDomains((prev) => prev.filter((d) => d.id !== id));
    setRemoving(null);
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8F9FC",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "2px solid #E5E7EB",
            borderTopColor: "#2952E3",
            animation: "spin 700ms linear infinite",
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (plan !== "agency") {
    return <UpgradeWall />;
  }

  const sortedForTable = [...domains].sort((a, b) => {
    const ra = a.lastScan?.readiness_score ?? -1;
    const rb = b.lastScan?.readiness_score ?? -1;
    return rb - ra;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8F9FC",
        color: "#111827",
        padding: "36px 40px 80px",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div>
          <Link
            href="/dashboard"
            style={{
              fontSize: 12,
              color: "#9CA3AF",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              marginBottom: 8,
            }}
          >
            ← Dashboard
          </Link>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              margin: 0,
              color: "#111827",
            }}
          >
            Agency Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "#9CA3AF", margin: "4px 0 0" }}>
            Çoklu domain analizi ve karşılaştırma
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#9CA3AF",
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "6px 14px",
            }}
          >
            {domains.length} / 10 domain
          </span>
          <button
            onClick={() => setAdding(true)}
            disabled={domains.length >= 10}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 18px",
              borderRadius: 10,
              background:
                domains.length >= 10
                  ? "#F3F4F6"
                  : "linear-gradient(135deg, #2952E3, #7B3FE4)",
              color: domains.length >= 10 ? "#9CA3AF" : "#fff",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: domains.length >= 10 ? "not-allowed" : "pointer",
              fontFamily: "var(--font-geist-sans)",
              boxShadow:
                domains.length >= 10
                  ? "none"
                  : "0 0 20px rgba(41,82,227,0.28)",
            }}
          >
            + Domain Ekle
          </button>
        </div>
      </div>

      {/* Add domain form */}
      {adding && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 14,
            padding: "20px 24px",
            marginBottom: 24,
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "flex-end",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}
            >
              Domain *
            </label>
            <input
              autoFocus
              type="text"
              placeholder="musteri.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddDomain(); }}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                background: "#F9FAFB",
                color: "#111827",
                outline: "none",
                width: 200,
                fontFamily: "var(--font-geist-sans)",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}
            >
              Müşteri Adı (opsiyonel)
            </label>
            <input
              type="text"
              placeholder="Müşteri Adı"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                background: "#F9FAFB",
                color: "#111827",
                outline: "none",
                width: 180,
                fontFamily: "var(--font-geist-sans)",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}
            >
              Sektör
            </label>
            <select
              value={newSector}
              onChange={(e) => setNewSector(e.target.value)}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                background: "#F9FAFB",
                color: "#111827",
                outline: "none",
                width: 160,
                fontFamily: "var(--font-geist-sans)",
                cursor: "pointer",
              }}
            >
              {SECTORS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.emoji} {s.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleAddDomain}
              disabled={saving || !newDomain.trim()}
              style={{
                padding: "8px 20px",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                border: "none",
                background:
                  saving || !newDomain.trim()
                    ? "#F3F4F6"
                    : "linear-gradient(135deg, #2952E3, #7B3FE4)",
                color: saving || !newDomain.trim() ? "#9CA3AF" : "#fff",
                cursor: saving || !newDomain.trim() ? "not-allowed" : "pointer",
                fontFamily: "var(--font-geist-sans)",
              }}
            >
              {saving ? "Ekleniyor…" : "Ekle"}
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewDomain("");
                setNewSector("other");
                setNewNickname("");
              }}
              style={{
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                background: "#fff",
                color: "#6B7280",
                cursor: "pointer",
                fontFamily: "var(--font-geist-sans)",
              }}
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {domains.length === 0 && !adding && (
        <div
          style={{
            background: "#fff",
            border: "1px dashed #D1D5DB",
            borderRadius: 16,
            padding: "64px 32px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 14 }}>🏢</div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#374151",
              margin: "0 0 8px",
            }}
          >
            Henüz domain eklenmedi
          </h2>
          <p style={{ fontSize: 14, color: "#9CA3AF", margin: "0 0 20px" }}>
            İlk müşteri domainini ekleyerek başla
          </p>
          <button
            onClick={() => setAdding(true)}
            style={{
              padding: "10px 24px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
              color: "#fff",
              cursor: "pointer",
              fontFamily: "var(--font-geist-sans)",
              boxShadow: "0 0 20px rgba(41,82,227,0.28)",
            }}
          >
            + İlk Domainini Ekle
          </button>
        </div>
      )}

      {/* Domain cards grid */}
      {domains.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {domains.map((d) => (
            <div
              key={d.id}
              style={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 14,
                padding: "20px 20px 16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 0,
              }}
            >
              {/* Card header */}
              <div style={{ marginBottom: 4 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#111827",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.nickname ? `🏷️ ${d.nickname}` : d.domain}
                </div>
                {d.nickname && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#9CA3AF",
                      marginTop: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {d.domain}
                  </div>
                )}
              </div>

              {/* Sector */}
              <div
                style={{
                  fontSize: 12,
                  color: "#6B7280",
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span>{sectorEmoji(d.sector)}</span>
                <span>{sectorLabel(d.sector)}</span>
              </div>

              {/* Scores */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginBottom: 14,
                  padding: "12px 14px",
                  background: "#F9FAFB",
                  borderRadius: 10,
                  border: "1px solid #F3F4F6",
                }}
              >
                {[
                  { label: "Readiness", score: d.lastScan?.readiness_score },
                  { label: "Authority", score: d.lastScan?.authority_score },
                  { label: "Influence", score: d.lastScan?.influence_score },
                ].map(({ label, score }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: 12, color: "#6B7280" }}>
                      {label}
                    </span>
                    <ScorePill score={score} />
                  </div>
                ))}
              </div>

              {/* Last scan */}
              <div
                style={{
                  fontSize: 11,
                  color: "#9CA3AF",
                  marginBottom: 14,
                }}
              >
                Son scan:{" "}
                {d.lastScan ? formatDate(d.lastScan.created_at) : "Hiç taranmadı"}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                <button
                  onClick={() =>
                    router.push(
                      `/score?domain=${encodeURIComponent(d.domain)}${d.sector ? `&sector=${d.sector}` : ""}`
                    )
                  }
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: "none",
                    background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
                    color: "#fff",
                    cursor: "pointer",
                    fontFamily: "var(--font-geist-sans)",
                  }}
                >
                  Tara
                </button>
                <button
                  onClick={() => handleRemoveDomain(d.id)}
                  disabled={removing === d.id}
                  style={{
                    padding: "8px 14px",
                    fontSize: 12,
                    fontWeight: 500,
                    borderRadius: 8,
                    border: "1px solid #FCA5A5",
                    background: removing === d.id ? "#FEF2F2" : "#fff",
                    color: "#EF4444",
                    cursor: removing === d.id ? "wait" : "pointer",
                    fontFamily: "var(--font-geist-sans)",
                    opacity: removing === d.id ? 0.6 : 1,
                  }}
                >
                  Kaldır
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comparison table */}
      {domains.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 14px",
              letterSpacing: "-0.02em",
            }}
          >
            Karşılaştırma Tablosu
          </h2>
          <div
            style={{
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "#FAFAFA",
                    borderBottom: "1px solid #F3F4F6",
                  }}
                >
                  {["Domain", "Sektör", "Readiness", "Authority", "Influence", "Son Scan", "İşlem"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#9CA3AF",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedForTable.map((d, i) => (
                  <tr
                    key={d.id}
                    style={{
                      borderBottom:
                        i < sortedForTable.length - 1
                          ? "1px solid #F9FAFB"
                          : "none",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#111827",
                        maxWidth: 180,
                      }}
                    >
                      <div
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={d.domain}
                      >
                        {d.nickname ? (
                          <>
                            <span style={{ color: "#374151" }}>
                              {d.nickname}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: "#9CA3AF",
                                fontWeight: 400,
                                display: "block",
                              }}
                            >
                              {d.domain}
                            </span>
                          </>
                        ) : (
                          d.domain
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 13, color: "#6B7280" }}>
                        {sectorEmoji(d.sector)} {sectorLabel(d.sector)}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <ScorePill score={d.lastScan?.readiness_score} />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <ScorePill score={d.lastScan?.authority_score} />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <ScorePill score={d.lastScan?.influence_score} />
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 12,
                        color: "#9CA3AF",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {d.lastScan ? formatDate(d.lastScan.created_at) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() =>
                          router.push(
                            `/score?domain=${encodeURIComponent(d.domain)}${d.sector ? `&sector=${d.sector}` : ""}`
                          )
                        }
                        style={{
                          padding: "5px 14px",
                          fontSize: 12,
                          fontWeight: 600,
                          borderRadius: 7,
                          border: "none",
                          background: "rgba(41,82,227,0.08)",
                          color: "#2952E3",
                          cursor: "pointer",
                          fontFamily: "var(--font-geist-sans)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Tara →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
