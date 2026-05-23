"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface PendingScan {
  domain: string;
  readiness: number | null;
  authority: number | null;
  influence: number | null;
  insight: {
    hero_text: string | null;
    strongest_point: string | null;
    critical_gap: string | null;
    quick_win: string | null;
  } | null;
}

interface ScanRecord {
  id: string;
  domain: string;
  readiness_score: number | null;
  created_at: string;
}

// ─── Animated counter ──────────────────────────────────────────────────────────
function useCounter(target: number | null, duration = 1400) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === null || target === 0) { setCount(0); return; }
    let startTime: number | null = null;
    let rafId: number;
    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return count;
}

// ─── Metric card — big number + thin arc ──────────────────────────────────────
function MetricCard({
  value, label, sublabel, gradId, locked, soon,
}: {
  value: number | null; label: string; sublabel: string;
  gradId: string; locked?: boolean; soon?: boolean;
}) {
  const active = !locked && !soon && value !== null;
  const displayed = useCounter(active ? value : null);
  const size = 60;
  const stroke = 2.5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = active ? circ * (1 - (value as number) / 100) : circ;
  const arcStart = locked ? "#F59E0B" : "#2952E3";
  const arcEnd   = locked ? "#EF4444" : "#7B3FE4";

  return (
    <div style={{
      flex: 1, padding: "24px 26px",
      background: "#fff",
      border: "1px solid #E5E7EB",
      borderRadius: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: "#9CA3AF",
        textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12,
      }}>
        {label}
      </div>

      {/* Big gradient number */}
      <div style={{
        fontSize: 68, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1,
        background: active ? "linear-gradient(135deg, #2952E3, #7B3FE4)" : "none",
        WebkitBackgroundClip: active ? "text" : "unset",
        backgroundClip: active ? "text" : "unset",
        color: active ? "transparent" : "#D1D5DB",
        fontFamily: "var(--font-geist-sans)", marginBottom: 10,
      }}>
        {active ? displayed : "—"}
      </div>

      <div style={{ fontSize: 12, color: "#9CA3AF" }}>
        {locked ? "Premium feature" : soon ? "Coming soon" : sublabel}
      </div>

      {(locked || soon) && (
        <div style={{
          marginTop: 12,
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 9px", borderRadius: 999,
          background: locked ? "#FEF9C3" : "#F3F4F6",
          border: locked ? "1px solid #FDE047" : "1px solid #E5E7EB",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
          color: locked ? "#A16207" : "#9CA3AF",
        }}>
          {locked && (
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
          {locked ? "PREMIUM" : "SOON"}
        </div>
      )}

      {/* Thin arc — top right */}
      <div style={{ position: "absolute", top: 18, right: 18, opacity: (locked || soon) ? 0.3 : 1 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={arcStart} />
              <stop offset="100%" stopColor={arcEnd} />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F0F1F5" strokeWidth={stroke} />
          {!soon && (
            <circle
              cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.32, 0, 0.67, 0)" }}
            />
          )}
        </svg>
      </div>
    </div>
  );
}

// ─── Insight row ───────────────────────────────────────────────────────────────
function InsightRow({ icon, label, text, color, bgColor, borderColor }: {
  icon: ReactNode; label: string; text: string; color: string; bgColor: string; borderColor: string;
}) {
  return (
    <div style={{ display: "flex", gap: 13, padding: "15px 0", borderBottom: "1px solid #F3F4F6" }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: bgColor, border: `1px solid ${borderColor}`,
        display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
          {label}
        </div>
        <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.65, margin: 0 }}>{text}</p>
      </div>
    </div>
  );
}

// ─── Checklist item ────────────────────────────────────────────────────────────
function ChecklistItem({ done, label, points, locked }: { done: boolean; label: string; points: number; locked?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", borderBottom: "1px solid #F9FAFB", opacity: locked ? 0.65 : 1 }}>
      <div style={{
        width: 17, height: 17, borderRadius: 5, flexShrink: 0,
        border: done ? "none" : "1.5px solid #D1D5DB",
        background: done ? "#16A34A" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {done && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {locked && !done && (
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        )}
      </div>
      <span style={{ flex: 1, fontSize: 13, color: done || locked ? "#9CA3AF" : "#374151", textDecoration: done ? "line-through" : "none" }}>
        {label}
      </span>
      {!done && !locked && (
        <span style={{ fontSize: 11, fontWeight: 600, color: "#2952E3", fontFamily: "var(--font-geist-mono)", whiteSpace: "nowrap" }}>
          +{points}
        </span>
      )}
      {locked && (
        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999, background: "#FEF9C3", border: "1px solid #FDE047", color: "#A16207", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
          PRO
        </span>
      )}
    </div>
  );
}

// ─── Sidebar nav item ──────────────────────────────────────────────────────────
function NavItem({ icon, label, active, onClick, href }: {
  icon: ReactNode; label: string; active?: boolean; onClick?: () => void; href?: string;
}) {
  const inner = (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "8px 10px", borderRadius: 8, marginBottom: 2,
        background: active ? "#F3F4F6" : "transparent",
        color: active ? "#111827" : "#6B7280",
        cursor: "pointer", userSelect: "none",
      }}
    >
      {icon}
      <span style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>{label}</span>
    </div>
  );
  if (href) return <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link>;
  return inner;
}

// ─── Sector data ───────────────────────────────────────────────────────────────
const SECTOR_AGENTS: Record<string, { name: string; label: string }> = {
  restaurant:  { name: "Savor",  label: "Restaurant" },
  hospitality: { name: "Haven",  label: "Hospitality" },
  clinic:      { name: "Vita",   label: "Medical" },
  education:   { name: "Sage",   label: "Education" },
  ecommerce:   { name: "Flux",   label: "Commerce" },
  saas:        { name: "Nexus",  label: "SaaS" },
  realestate:  { name: "Stone",  label: "Property" },
  legal:       { name: "Vero",   label: "Legal" },
  finance:     { name: "Calix",  label: "Finance" },
  creator:     { name: "Lumen",  label: "Creator" },
  marketing:   { name: "Jan",    label: "Marketing" },
};

type ChecklistEntry = { label: string; points: number };

const SECTOR_CHECKLIST: Record<string, ChecklistEntry[]> = {
  restaurant: [
    { label: "Google Business Profile optimize et", points: 15 },
    { label: "Restaurant schema ekle",              points: 12 },
    { label: "TripAdvisor profilini güncelle",       points: 10 },
    { label: "llms.txt oluştur",                    points: 10 },
    { label: "Menüyü HTML olarak indexle",           points:  8 },
    { label: "Yorum yanıtlama sistemini kur",        points:  8 },
  ],
  hospitality: [
    { label: "Google Business Profile optimize et", points: 15 },
    { label: "LodgingBusiness schema ekle",         points: 12 },
    { label: "llms.txt oluştur",                    points: 10 },
    { label: "OTA profillerini optimize et",        points: 10 },
    { label: "Deneyim sayfaları oluştur",           points:  8 },
    { label: "Misafir yorumlarına yanıt ver",       points:  8 },
  ],
  clinic: [
    { label: "MedicalClinic schema ekle",           points: 15 },
    { label: "Doktor profil sayfaları oluştur",     points: 12 },
    { label: "llms.txt oluştur",                    points: 10 },
    { label: "Trustpilot profili kur",              points: 10 },
    { label: "Çok dilli içerik ekle",               points:  8 },
    { label: "Akreditasyon sertifikaları ekle",     points:  8 },
  ],
  education: [
    { label: "EducationalOrganization schema ekle", points: 15 },
    { label: "Program sayfalarını optimize et",     points: 12 },
    { label: "llms.txt oluştur",                    points: 10 },
    { label: "Akreditasyon markup ekle",            points: 10 },
    { label: "Uluslararası öğrenci rehberi yaz",   points:  8 },
    { label: "Akademisyen profilleri oluştur",      points:  8 },
  ],
  ecommerce: [
    { label: "Product schema her ürüne ekle",       points: 15 },
    { label: "llms.txt oluştur",                    points: 10 },
    { label: "Google Shopping feed aktif et",       points: 10 },
    { label: "Trustpilot profili kur",              points: 10 },
    { label: "Alıcı rehberleri yaz",                points:  8 },
    { label: "Reddit/Quora varlığı oluştur",        points:  8 },
  ],
  saas: [
    { label: "SoftwareApplication schema ekle",     points: 15 },
    { label: "Documentation AI-readable yap",       points: 12 },
    { label: "llms.txt oluştur",                    points: 10 },
    { label: "G2/Capterra profili optimize et",     points: 10 },
    { label: "Karşılaştırma sayfaları oluştur",    points: 10 },
    { label: "GitHub presence kur",                 points:  8 },
  ],
  realestate: [
    { label: "RealEstateAgent schema ekle",         points: 15 },
    { label: "Danışman profil sayfaları oluştur",  points: 12 },
    { label: "llms.txt oluştur",                    points: 10 },
    { label: "Çok dilli içerik ekle",               points: 10 },
    { label: "Bölge rehberleri yaz",                points:  8 },
    { label: "Google Business Profile optimize et", points:  8 },
  ],
  legal: [
    { label: "LegalService schema ekle",            points: 15 },
    { label: "Avukat profil sayfaları oluştur",     points: 12 },
    { label: "llms.txt oluştur",                    points: 10 },
    { label: "Baro akreditasyon markup ekle",       points: 10 },
    { label: "Çok dilli içerik ekle",               points:  8 },
    { label: "Expat rehber içerikleri yaz",         points:  8 },
  ],
  finance: [
    { label: "FinancialService schema ekle",        points: 15 },
    { label: "Lisans sertifikaları görünür yap",   points: 12 },
    { label: "llms.txt oluştur",                    points: 10 },
    { label: "Danışman profil sayfaları oluştur",  points: 10 },
    { label: "Eğitici içerik serisi yaz",          points:  8 },
    { label: "Trustpilot profili kur",              points:  8 },
  ],
  creator: [
    { label: "Person schema ekle",                  points: 15 },
    { label: "LinkedIn profili optimize et",        points: 12 },
    { label: "llms.txt oluştur",                    points: 10 },
    { label: "Wikidata kaydı oluştur",              points: 10 },
    { label: "Thought leadership içerik başlat",   points:  8 },
    { label: "Podcast tour planla",                 points:  8 },
  ],
  marketing: [
    { label: "ProfessionalService schema ekle",     points: 15 },
    { label: "Clutch profili oluştur",              points: 12 },
    { label: "llms.txt oluştur",                    points: 10 },
    { label: "Case study sayfaları yaz",            points: 10 },
    { label: "LinkedIn thought leadership başlat", points:  8 },
    { label: "Ödül ve akreditasyon ekle",          points:  8 },
  ],
};

const SECTORS = [
  { key: "restaurant",  emoji: "🍽️", label: "Restaurant" },
  { key: "hospitality", emoji: "🏨", label: "Hospitality" },
  { key: "clinic",      emoji: "🏥", label: "Clinic" },
  { key: "education",   emoji: "🎓", label: "Education" },
  { key: "ecommerce",   emoji: "🛍️", label: "E-commerce" },
  { key: "saas",        emoji: "💻", label: "SaaS" },
  { key: "realestate",  emoji: "🏠", label: "Real Estate" },
  { key: "legal",       emoji: "⚖️", label: "Legal" },
  { key: "finance",     emoji: "💰", label: "Finance" },
  { key: "creator",     emoji: "✨", label: "Creator" },
  { key: "marketing",   emoji: "📢", label: "Marketing Agency" },
];

// ─── Trend chart ───────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function TrendChart({ scans }: { scans: ScanRecord[] }) {
  const pts_raw = [...scans].slice(0, 5).reverse();
  const VW = 500, VH = 130;
  const padL = 32, padR = 12, padT = 28, padB = 32;
  const cW = VW - padL - padR;
  const cH = VH - padT - padB;
  const n = pts_raw.length;

  const pts = pts_raw.map((s, i) => {
    const x = n <= 1 ? padL + cW / 2 : padL + (i / (n - 1)) * cW;
    const score = s.readiness_score ?? 0;
    const y = padT + (1 - score / 100) * cH;
    return { x, y, score, date: s.created_at };
  });

  const polylineStr = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${VW} ${VH}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="trendLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2952E3" />
          <stop offset="100%" stopColor="#7B3FE4" />
        </linearGradient>
      </defs>
      {[25, 50, 75].map(v => {
        const y = padT + (1 - v / 100) * cH;
        return (
          <g key={v}>
            <line x1={padL} y1={y} x2={VW - padR} y2={y} stroke="#F3F4F6" strokeWidth="1" />
            <text x={padL - 4} y={y + 3.5} fontSize="8" fill="#D1D5DB" textAnchor="end">{v}</text>
          </g>
        );
      })}
      {n > 1 && (
        <polyline points={polylineStr} fill="none" stroke="url(#trendLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#fff" stroke="#2952E3" strokeWidth="2" />
          <text x={p.x} y={p.y - 9} fontSize="10" fontWeight="700" fill="#2952E3" textAnchor="middle">{p.score}</text>
          <text x={p.x} y={VH - 4} fontSize="9" fill="#9CA3AF" textAnchor="middle">{fmtDate(p.date)}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Sector modal ──────────────────────────────────────────────────────────────
function SectorModal({ onClose, onSelect }: { onClose: () => void; onSelect: (sector: string) => Promise<void> }) {
  const [saving, setSaving] = useState(false);

  async function handleSelect(key: string) {
    setSaving(true);
    await onSelect(key);
    setSaving(false);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(17,24,39,0.45)",
      backdropFilter: "blur(5px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "36px 36px 28px",
        width: "100%", maxWidth: 560,
        boxShadow: "0 24px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.06)",
        border: "1px solid #E5E7EB",
      }}>
        <h2 style={{ fontSize: 21, fontWeight: 700, color: "#111827", margin: "0 0 6px", letterSpacing: "-0.025em" }}>
          İşletmeniz hangi sektörde?
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 26px", lineHeight: 1.5 }}>
          Sektörünüze özel AI analizi için seçin
        </p>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 22,
          opacity: saving ? 0.5 : 1, transition: "opacity 150ms",
        }}>
          {SECTORS.map((s) => (
            <button
              key={s.key}
              onClick={() => handleSelect(s.key)}
              disabled={saving}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "14px 6px", borderRadius: 10,
                background: "#F9FAFB", border: "1.5px solid #E5E7EB",
                cursor: saving ? "wait" : "pointer", gap: 7,
                fontFamily: "var(--font-geist-sans)",
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{s.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#374151", textAlign: "center", lineHeight: 1.3 }}>
                {s.label}
              </span>
            </button>
          ))}
        </div>

        <div style={{ textAlign: "center" }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              fontSize: 13, color: "#9CA3AF", background: "none", border: "none",
              cursor: "pointer", fontFamily: "var(--font-geist-sans)", padding: "4px 0",
            }}
          >
            Daha sonra seç
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Scan modal ────────────────────────────────────────────────────────────────
function ScanModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (domain: string) => void }) {
  const [domain, setDomain] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(17,24,39,0.22)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 20, padding: "32px 36px",
        width: "100%", maxWidth: 480,
        boxShadow: "0 24px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
        border: "1px solid #E5E7EB",
      }}>
        <div style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Scan a domain
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>
            Enter any website URL to analyse its AI visibility score.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = domain.trim();
            if (trimmed) onSubmit(trimmed);
          }}
        >
          <div style={{
            display: "flex", alignItems: "center",
            border: "1.5px solid #E5E7EB", borderRadius: 12, overflow: "hidden",
            marginBottom: 16,
            transition: "border-color 180ms",
          }}>
            <span style={{ padding: "0 14px", fontSize: 14, color: "#9CA3AF", flexShrink: 0, userSelect: "none" }}>
              https://
            </span>
            <input
              autoFocus
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              style={{
                flex: 1, padding: "12px 14px 12px 0",
                border: "none", outline: "none",
                fontSize: 14, color: "#111827",
                fontFamily: "var(--font-geist-sans)",
                background: "transparent",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="submit"
              style={{
                flex: 1, padding: "12px 20px", borderRadius: 10,
                background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
                color: "#fff", fontSize: 14, fontWeight: 600,
                border: "none", cursor: "pointer",
                fontFamily: "var(--font-geist-sans)",
                boxShadow: "0 0 20px rgba(41,82,227,0.28)",
              }}
            >
              Analyse →
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "12px 20px", borderRadius: 10,
                background: "#F3F4F6",
                color: "#6B7280", fontSize: 14, fontWeight: 500,
                border: "1px solid #E5E7EB", cursor: "pointer",
                fontFamily: "var(--font-geist-sans)",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingScan, setPendingScan] = useState<PendingScan | null>(null);
  const [showScan, setShowScan] = useState(false);
  const [sector, setSector] = useState<string | null | undefined>(undefined);
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/auth/login");
      } else {
        setUser(data.user);
        setLoading(false);
      }
    });
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const supabase = createSupabaseBrowserClient();
    const raw = localStorage.getItem("pendingScan");
    if (raw) {
      try {
        const parsed: PendingScan = JSON.parse(raw);
        setPendingScan(parsed);
        localStorage.removeItem("pendingScan");
        supabase.from("scans").insert({
          user_id: user.id,
          domain: parsed.domain,
          readiness_score: parsed.readiness,
          authority_score: parsed.authority,
          influence_score: parsed.influence,
          insight: parsed.insight,
        }).then(() => {});
      } catch { /* ignore */ }
    } else {
      supabase
        .from("scans")
        .select("domain, readiness_score, authority_score, influence_score, insight")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setPendingScan({
              domain: data.domain as string,
              readiness: data.readiness_score as number | null,
              authority: data.authority_score as number | null,
              influence: data.influence_score as number | null,
              insight: data.insight as PendingScan["insight"],
            });
          }
        });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const supabase = createSupabaseBrowserClient();
    supabase
      .from("profiles")
      .select("sector")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const s = (data?.sector as string | null) ?? null;
        setSector(s);
        if (s === null) setShowSectorModal(true);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const supabase = createSupabaseBrowserClient();
    supabase
      .from("scans")
      .select("id, domain, readiness_score, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setScanHistory(data as ScanRecord[]);
      });
  }, [user]);

  async function handleSectorSelect(selectedSector: string) {
    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("profiles")
      .upsert({ id: user!.id, sector: selectedSector }, { onConflict: "id" });
    setSector(selectedSector);
    setShowSectorModal(false);
  }

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  function handleScanSubmit(domain: string) {
    setShowScan(false);
    router.push(`/score?domain=${encodeURIComponent(domain)}`);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8F9FC" }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 700ms linear infinite}`}</style>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div className="spin" style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid #E5E7EB", borderTopColor: "#2952E3" }} />
          <span style={{ fontSize: 13, color: "#9CA3AF" }}>Loading…</span>
        </div>
      </div>
    );
  }

  const hasScan = pendingScan !== null;

  const sectorChecklist = sector ? (SECTOR_CHECKLIST[sector] ?? null) : null;

  type IssueStatus = "critical" | "fixed" | "passing" | "locked";
  const issues: { issue: string; status: IssueStatus }[] = sectorChecklist
    ? [
        ...sectorChecklist.slice(0, 3).map(c => ({ issue: c.label, status: "critical" as IssueStatus })),
        ...sectorChecklist.slice(3).map(c => ({ issue: c.label, status: "locked" as IssueStatus })),
        { issue: "HTTPS active",           status: "passing" as IssueStatus },
        { issue: "Sitemap present",        status: "passing" as IssueStatus },
        { issue: "Robots.txt configured",  status: "passing" as IssueStatus },
      ]
    : [
        { issue: "Schema.org missing",       status: "critical" as IssueStatus },
        { issue: "Answer-first content low", status: "critical" as IssueStatus },
        { issue: "Entity links missing",     status: "critical" as IssueStatus },
        { issue: "llms.txt added",           status: "fixed"    as IssueStatus },
        { issue: "OG tags completed",        status: "fixed"    as IssueStatus },
        { issue: "Robots.txt configured",    status: "passing"  as IssueStatus },
        { issue: "HTTPS active",             status: "passing"  as IssueStatus },
        { issue: "Page speed acceptable",    status: "passing"  as IssueStatus },
        { issue: "Sitemap present",          status: "passing"  as IssueStatus },
      ];

  const criticalCount = issues.filter(i => i.status === "critical").length;
  const fixedCount    = issues.filter(i => i.status === "fixed").length;
  const passingCount  = issues.filter(i => i.status === "passing").length;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F8F9FC", color: "#111827", overflow: "hidden" }}>

      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes spin { to { transform: rotate(360deg) } }
        .spin { animation: spin 700ms linear infinite }
        ::-webkit-scrollbar { width: 5px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 4px }
      `}</style>

      {/* ── Scan modal ── */}
      {showScan && <ScanModal onClose={() => setShowScan(false)} onSubmit={handleScanSubmit} />}

      {/* ── Sector modal ── */}
      {showSectorModal && (
        <SectorModal
          onClose={() => setShowSectorModal(false)}
          onSelect={handleSectorSelect}
        />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        width: 224, flexShrink: 0,
        borderRight: "1px solid #E5E7EB",
        display: "flex", flexDirection: "column",
        background: "#fff",
      }}>
        {/* Logo */}
        <div style={{ padding: "22px 20px 20px", borderBottom: "1px solid #F3F4F6" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{
              fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
              WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
            }}>
              Genessa
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ padding: "14px 12px", flex: 1 }}>
          <NavItem
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>}
            label="Dashboard" active
          />
          <NavItem
            onClick={() => setShowScan(true)}
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>}
            label="New scan"
          />
        </nav>

        {/* Agent status */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid #F3F4F6" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
            Active Agent
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: "linear-gradient(135deg, rgba(41,82,227,0.1), rgba(123,63,228,0.1))",
              border: "1px solid rgba(41,82,227,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4F6EE6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                {sector && SECTOR_AGENTS[sector] ? `${SECTOR_AGENTS[sector].name} Agent` : "General Agent"}
              </div>
              <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 1, lineHeight: 1.3 }}>
                {sector && SECTOR_AGENTS[sector]
                  ? `${SECTOR_AGENTS[sector].label} Intelligence Operator`
                  : "Multi-sector analysis"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#16A34A", animation: "pulse-dot 2.5s ease infinite" }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: "#16A34A" }}>Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* User */}
        <div style={{ padding: "14px 16px 20px", borderTop: "1px solid #F3F4F6" }}>
          <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 10, wordBreak: "break-all", lineHeight: 1.4 }}>
            {user?.email}
          </div>
          <button
            onClick={handleSignOut}
            style={{
              width: "100%", fontSize: 12, fontWeight: 500, color: "#6B7280",
              background: "none", border: "1px solid #E5E7EB",
              borderRadius: 7, padding: "7px 12px", cursor: "pointer",
              fontFamily: "var(--font-geist-sans)", textAlign: "center",
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, overflowY: "auto", padding: "36px 40px 80px" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 30 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#2952E3", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7, opacity: 0.7 }}>
              AI Visibility Control Center
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", margin: 0, color: "#111827" }}>
              Dashboard
            </h1>
          </div>
          <button
            onClick={() => setShowScan(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 10,
              background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
              color: "#fff", fontSize: 13, fontWeight: 600,
              border: "none", cursor: "pointer",
              fontFamily: "var(--font-geist-sans)",
              boxShadow: "0 0 20px rgba(41,82,227,0.28)",
            }}
          >
            + Run a scan
          </button>
        </div>

        {!hasScan ? (
          /* ── Empty state ── */
          <div style={{
            border: "1px dashed #D1D5DB", borderRadius: 20,
            padding: "96px 32px", textAlign: "center",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%", margin: "0 auto 22px",
              background: "linear-gradient(135deg, rgba(41,82,227,0.08), rgba(123,63,228,0.08))",
              border: "1px solid rgba(41,82,227,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F6EE6" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 10px", color: "#111827" }}>
              No scans yet
            </h2>
            <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, maxWidth: 360, margin: "0 auto 30px" }}>
              Run your first AI visibility scan to get your Readiness, Authority, and Influence scores — and a personalised action plan.
            </p>
            <button
              onClick={() => setShowScan(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "13px 28px", borderRadius: 11,
                background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
                color: "#fff", fontSize: 14, fontWeight: 600,
                border: "none", cursor: "pointer",
                fontFamily: "var(--font-geist-sans)",
                boxShadow: "0 0 28px rgba(41,82,227,0.32)",
              }}
            >
              Scan your first domain →
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ── Top metric strip ── */}
            <div style={{ display: "flex", gap: 14 }}>
              <MetricCard value={pendingScan!.readiness} label="AI Readiness" sublabel="Technical infrastructure" gradId="arcGradReadiness" />
              <MetricCard value={pendingScan!.authority} label="Authority"    sublabel="Semantic authority"       gradId="arcGradAuthority" soon />
              <MetricCard value={pendingScan!.influence} label="AI Influence" sublabel="AI mention tracking"     gradId="arcGradInfluence" locked />
            </div>

            {/* Domain / rescan bar */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 18px", borderRadius: 12,
              background: "#fff", border: "1px solid #E5E7EB",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16A34A", boxShadow: "0 0 6px rgba(22,163,74,0.5)", flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                  {pendingScan!.domain}
                </span>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>· Just scanned</span>
              </div>
              <button
                onClick={() => setShowScan(true)}
                style={{
                  fontSize: 12, fontWeight: 600, color: "#2952E3",
                  background: "rgba(41,82,227,0.06)", border: "1px solid rgba(41,82,227,0.15)",
                  borderRadius: 8, padding: "6px 16px", cursor: "pointer",
                  fontFamily: "var(--font-geist-sans)",
                }}
              >
                Rescan
              </button>
            </div>

            {/* Score Trend */}
            <section style={{
              borderRadius: 16, padding: "20px 24px",
              background: "#fff", border: "1px solid #E5E7EB",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Score Trend</div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Readiness score over time</div>
              </div>
              {scanHistory.length < 2 ? (
                <div style={{ padding: "20px 0", textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0, lineHeight: 1.6 }}>
                    Rescan after making improvements to see your trend.
                  </p>
                </div>
              ) : (
                <TrendChart scans={scanHistory} />
              )}
            </section>

            {/* ── Middle: AI Insight + Checklist/Issues ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 292px", gap: 14, alignItems: "start" }}>

              {/* AI Insight */}
              <section style={{
                borderRadius: 16, padding: "24px 26px",
                background: "#fff", border: "1px solid #E5E7EB",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 14px rgba(41,82,227,0.25)",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>AI Intelligence</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>Powered by Claude</div>
                  </div>
                </div>

                {pendingScan!.insight ? (
                  <>
                    {pendingScan!.insight.hero_text && (
                      <p style={{
                        fontSize: 16, fontWeight: 500, color: "#1F2937",
                        lineHeight: 1.65, margin: "0 0 18px", paddingBottom: 18,
                        borderBottom: "1px solid #F3F4F6",
                      }}>
                        {pendingScan!.insight.hero_text}
                      </p>
                    )}
                    <div>
                      {pendingScan!.insight.strongest_point && (
                        <InsightRow
                          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                          label="Strongest point" color="#16A34A"
                          bgColor="rgba(22,163,74,0.07)" borderColor="rgba(22,163,74,0.18)"
                          text={pendingScan!.insight.strongest_point}
                        />
                      )}
                      {pendingScan!.insight.critical_gap && (
                        <InsightRow
                          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
                          label="Critical gap" color="#DC2626"
                          bgColor="rgba(220,38,38,0.06)" borderColor="rgba(220,38,38,0.15)"
                          text={pendingScan!.insight.critical_gap}
                        />
                      )}
                      {pendingScan!.insight.quick_win && (
                        <InsightRow
                          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>}
                          label="Quick win" color="#2563EB"
                          bgColor="rgba(37,99,235,0.06)" borderColor="rgba(37,99,235,0.15)"
                          text={pendingScan!.insight.quick_win}
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 1.65 }}>
                    Run a scan to get AI-powered insights and recommendations.
                  </p>
                )}
              </section>

              {/* Right column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Quick Actions */}
                <section style={{
                  borderRadius: 16, padding: "20px 20px",
                  background: "#fff", border: "1px solid #E5E7EB",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 3 }}>Quick Actions</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 14 }}>Fix these to improve your score</div>
                  {sectorChecklist
                    ? sectorChecklist.map((item, i) => (
                        <ChecklistItem key={item.label} done={false} label={item.label} points={item.points} locked={i >= 3} />
                      ))
                    : (
                      <>
                        <ChecklistItem done={false} label="Add Organization schema"       points={15} />
                        <ChecklistItem done={false} label="Answer-first homepage content" points={15} />
                        <ChecklistItem done={false} label="article:published_time meta"   points={5} />
                        <ChecklistItem done={true}  label="llms.txt in place"             points={0} />
                        <ChecklistItem done={true}  label="Robots.txt allows AI bots"     points={0} />
                      </>
                    )}
                </section>

                {/* Issue summary */}
                <section style={{
                  borderRadius: 16, padding: "20px 20px",
                  background: "#fff", border: "1px solid #E5E7EB",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Issue Summary</div>
                  <div style={{ display: "flex" }}>
                    {[
                      { count: criticalCount, label: "Critical", color: "#DC2626", muted: "rgba(220,38,38,0.55)" },
                      { count: fixedCount,    label: "Fixed",    color: "#16A34A", muted: "rgba(22,163,74,0.55)" },
                      { count: passingCount,  label: "Passing",  color: "#6B7280", muted: "#9CA3AF" },
                    ].map((item, i) => (
                      <div key={i} style={{ flex: 1, textAlign: "center", paddingRight: i < 2 ? 0 : undefined, borderRight: i < 2 ? "1px solid #F3F4F6" : "none" }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: item.color, letterSpacing: "-0.04em" }}>{item.count}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: item.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 2 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            {/* ── Bottom: Technical Issues table ── */}
            <section style={{
              borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden",
              background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Technical Issues</div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#FAFAFA" }}>
                    {["Issue", "Status", "Since"].map((h, i) => (
                      <th key={h} style={{
                        padding: "10px 24px", textAlign: i === 2 ? "right" : "left",
                        fontSize: 10, fontWeight: 700, color: "#9CA3AF",
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        borderBottom: "1px solid #F3F4F6",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {issues.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F9FAFB" }}>
                      <td style={{ padding: "12px 24px", opacity: row.status === "locked" ? 0.55 : 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                            background: row.status === "critical" ? "#DC2626" : row.status === "fixed" ? "#16A34A" : row.status === "locked" ? "#D97706" : "#D1D5DB",
                          }} />
                          <span style={{
                            fontSize: 13,
                            color: row.status === "fixed" || row.status === "locked" ? "#9CA3AF" : "#374151",
                            textDecoration: row.status === "fixed" ? "line-through" : "none",
                          }}>
                            {row.issue}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          background: row.status === "critical" ? "#FEF2F2" : row.status === "fixed" ? "#F0FDF4" : row.status === "locked" ? "#FEF9C3" : "#F3F4F6",
                          color: row.status === "critical" ? "#DC2626" : row.status === "fixed" ? "#16A34A" : row.status === "locked" ? "#A16207" : "#6B7280",
                          border: `1px solid ${row.status === "critical" ? "#FECACA" : row.status === "fixed" ? "#BBF7D0" : row.status === "locked" ? "#FDE047" : "#E5E7EB"}`,
                        }}>
                          {row.status === "locked" ? "PRO" : row.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 24px", textAlign: "right", fontSize: 11, color: "#9CA3AF", fontFamily: "var(--font-geist-mono)" }}>
                        {row.status === "fixed" ? "Fixed" : row.status === "locked" ? "—" : "First scan"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Scan History */}
            {scanHistory.length > 0 && (
              <section style={{
                borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden",
                background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}>
                <div style={{ padding: "16px 24px", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Scan History</div>
                </div>
                {scanHistory.slice(0, 5).map((scan, i) => (
                  <div key={scan.id} style={{
                    display: "flex", alignItems: "center",
                    padding: "12px 24px",
                    borderBottom: i < Math.min(scanHistory.length, 5) - 1 ? "1px solid #F9FAFB" : "none",
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {scan.domain}
                      </div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{fmtDate(scan.created_at)}</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#2952E3", letterSpacing: "-0.03em", margin: "0 20px", fontFamily: "var(--font-geist-sans)" }}>
                      {scan.readiness_score ?? "—"}
                    </div>
                    <button
                      onClick={() => router.push(`/score?domain=${encodeURIComponent(scan.domain)}`)}
                      style={{
                        fontSize: 12, fontWeight: 600, color: "#2952E3",
                        background: "rgba(41,82,227,0.06)", border: "1px solid rgba(41,82,227,0.15)",
                        borderRadius: 8, padding: "6px 14px", cursor: "pointer",
                        fontFamily: "var(--font-geist-sans)", whiteSpace: "nowrap",
                      }}
                    >
                      View →
                    </button>
                  </div>
                ))}
              </section>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
