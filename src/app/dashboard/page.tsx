"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { canAccess, getPlanLabel, getPlanColor, PLAN_LIMITS, normalizePlan, type Plan } from "@/lib/plan";
import EngineScoresPanel from "@/components/dashboard/EngineScoresPanel";

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

interface AgencyDomain {
  id: string;
  domain: string;
  sector: string | null;
  nickname: string | null;
  lastScan?: {
    readiness_score: number | null;
    authority_score: number | null;
    influence_score: number | null;
    created_at: string;
  } | null;
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


// ─── Sector data ───────────────────────────────────────────────────────────────
const SECTOR_EMOJI: Record<string, string> = {
  restaurant: "🍽️", clinic: "🏥", saas: "💻", hotel: "🏨",
  creator: "🎨", legal: "⚖️", ecommerce: "🛒", other: "🔧",
  hospitality: "🏨", education: "🎓", realestate: "🏠", finance: "💰", marketing: "📢",
};

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

type ChecklistEntry = {
  label: string;
  priority: "this_week" | "this_month" | "long_term";
  points: number;
};

type GrowthAuditResult = {
  overallScore: number;
  summary: string;
  priorityActions: {
    title: string;
    impact: "high" | "medium" | "low";
    effort: "quick" | "medium" | "long";
    agent: "technical" | "content" | "authority";
  }[];
  agents: {
    technical: { score: number; topFix: string };
    content: { score: number; topFix: string };
    authority: { score: number; topFix: string };
  };
};

const SECTOR_CHECKLIST: Record<string, ChecklistEntry[]> = {
  restaurant: [
    { label: "Optimise your Google Business Profile",         priority: "this_week",   points: 15 },
    { label: "Mark up your menu with schema.org/Menu",        priority: "this_week",   points: 12 },
    { label: "Add llms.txt file",                             priority: "this_week",   points: 10 },
    { label: "Update TripAdvisor and Yelp profiles",          priority: "this_month",  points: 10 },
    { label: "Add booking link to structured data",           priority: "this_month",  points:  8 },
    { label: "Respond regularly to customer reviews",         priority: "this_month",  points:  8 },
    { label: "Write local cuisine content blog posts",        priority: "long_term",   points:  6 },
    { label: "Run competitor mention analysis",               priority: "long_term",   points:  5 },
  ],
  clinic: [
    { label: "Add MedicalOrganization schema",                          priority: "this_week",   points: 15 },
    { label: "Mark up doctor profiles with Person schema",              priority: "this_week",   points: 12 },
    { label: "Add llms.txt file",                                       priority: "this_week",   points: 10 },
    { label: "Set up a structured process for patient reviews",         priority: "this_month",  points: 10 },
    { label: "Enrich service pages with FAQ schema",                    priority: "this_month",  points:  8 },
    { label: "Strengthen E-E-A-T signals for health content",          priority: "this_month",  points:  8 },
    { label: "Publish medical authority articles",                      priority: "long_term",   points:  6 },
    { label: "Earn backlinks from other health institutions",           priority: "long_term",   points:  5 },
  ],
  saas: [
    { label: "Add SoftwareApplication schema",                          priority: "this_week",   points: 15 },
    { label: "Add llms.txt and ai.txt files",                           priority: "this_week",   points: 12 },
    { label: "Create a product comparison page",                        priority: "this_week",   points: 10 },
    { label: "Update G2 and Capterra profiles",                         priority: "this_month",  points: 10 },
    { label: "Make API documentation AI-readable",                      priority: "this_month",  points:  8 },
    { label: "Add use case pages by sector",                            priority: "this_month",  points:  8 },
    { label: "Write thought leadership blog posts",                     priority: "long_term",   points:  6 },
    { label: "Build a developer community presence",                    priority: "long_term",   points:  5 },
  ],
  hotel: [
    { label: "Add LodgingBusiness schema",                              priority: "this_week",   points: 15 },
    { label: "Mark up room types with schema",                          priority: "this_week",   points: 12 },
    { label: "Add llms.txt file",                                       priority: "this_week",   points: 10 },
    { label: "Highlight direct booking CTA",                            priority: "this_month",  points: 10 },
    { label: "Optimise Booking.com and TripAdvisor profiles",          priority: "this_month",  points:  8 },
    { label: "Create experience content pages",                         priority: "this_month",  points:  8 },
    { label: "Add local events and travel guide content",               priority: "long_term",   points:  6 },
    { label: "Set up a guest stories and UGC strategy",                 priority: "long_term",   points:  5 },
  ],
  creator: [
    { label: "Add Person schema with expertise areas",                  priority: "this_week",   points: 15 },
    { label: "Add llms.txt file",                                       priority: "this_week",   points: 12 },
    { label: "Make your LinkedIn profile AI-readable",                  priority: "this_week",   points: 10 },
    { label: "Create a media appearances and press page",               priority: "this_month",  points: 10 },
    { label: "Write an FAQ page for your area of expertise",            priority: "this_month",  points:  8 },
    { label: "Document your podcast and interview history",             priority: "this_month",  points:  8 },
    { label: "Set up a regular thought leadership content calendar",    priority: "long_term",   points:  6 },
    { label: "Be active in niche communities",                          priority: "long_term",   points:  5 },
  ],
  legal: [
    { label: "Add LegalService schema",                                 priority: "this_week",   points: 15 },
    { label: "Mark up lawyer profiles with Person schema",              priority: "this_week",   points: 12 },
    { label: "Add llms.txt file",                                       priority: "this_week",   points: 10 },
    { label: "Write legal guide content for your practice area",        priority: "this_month",  points: 10 },
    { label: "Update bar association profiles",                         priority: "this_month",  points:  8 },
    { label: "Set up a structure for client reviews",                   priority: "this_month",  points:  8 },
    { label: "Strengthen authority signals for legal content",          priority: "long_term",   points:  6 },
    { label: "Get featured in academic or industry publications",       priority: "long_term",   points:  5 },
  ],
  ecommerce: [
    { label: "Add Product schema to all products",                      priority: "this_week",   points: 15 },
    { label: "Add llms.txt and AI shopping signals",                    priority: "this_week",   points: 12 },
    { label: "Make product descriptions AI-readable",                   priority: "this_week",   points: 10 },
    { label: "Update Google Merchant Center",                           priority: "this_month",  points: 10 },
    { label: "Add FAQ schema to category pages",                        priority: "this_month",  points:  8 },
    { label: "Mark up customer reviews with structured data",           priority: "this_month",  points:  8 },
    { label: "Create product comparison pages",                         priority: "long_term",   points:  6 },
    { label: "Write buying guide content",                              priority: "long_term",   points:  5 },
  ],
  other: [
    { label: "Add Organization schema",                                 priority: "this_week",   points: 15 },
    { label: "Add llms.txt file",                                       priority: "this_week",   points: 12 },
    { label: "Complete Open Graph meta tags",                           priority: "this_week",   points: 10 },
    { label: "Enrich content with FAQ schema",                          priority: "this_month",  points: 10 },
    { label: "Optimise page speed",                                     priority: "this_month",  points:  8 },
    { label: "Regularly update content freshness",                      priority: "this_month",  points:  8 },
    { label: "Develop your backlink profile",                           priority: "long_term",   points:  6 },
    { label: "Set up an AI mention tracking system",                    priority: "long_term",   points:  5 },
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

// ─── Sector copy ───────────────────────────────────────────────────────────────
const SECTOR_COPY: Record<string, {
  heroTitle: string;
  heroSub: string;
  ctaLabel: string;
  scanLabel: string;
  reportTitle: string;
}> = {
  restaurant: {
    heroTitle: "Restaurant & Café AI Visibility",
    heroSub: "Let ChatGPT and Google recommend you for 'best café' searches.",
    ctaLabel: "Scan My Restaurant",
    scanLabel: "Local AI Scan",
    reportTitle: "Restaurant AI Visibility Report",
  },
  clinic: {
    heroTitle: "Clinic & Health AI Visibility",
    heroSub: "Patients are asking AI — is your clinic being recommended?",
    ctaLabel: "Scan My Clinic",
    scanLabel: "Health AI Scan",
    reportTitle: "Clinic AI Visibility Report",
  },
  saas: {
    heroTitle: "SaaS & Tech AI Visibility",
    heroSub: "Does your product show up in AI comparison queries?",
    ctaLabel: "Scan My Product",
    scanLabel: "SaaS AI Scan",
    reportTitle: "SaaS AI Visibility Report",
  },
  hotel: {
    heroTitle: "Hotel & Hospitality AI Visibility",
    heroSub: "Are AI travel assistants recommending your hotel?",
    ctaLabel: "Scan My Hotel",
    scanLabel: "Hospitality AI Scan",
    reportTitle: "Hotel AI Visibility Report",
  },
  creator: {
    heroTitle: "Creator & Consultant AI Visibility",
    heroSub: "Do AI systems recognise you as an expert?",
    ctaLabel: "Scan My Profile",
    scanLabel: "Creator AI Scan",
    reportTitle: "Creator AI Visibility Report",
  },
  legal: {
    heroTitle: "Legal & Finance AI Visibility",
    heroSub: "Clients are asking AI — are your E-E-A-T signals strong?",
    ctaLabel: "Scan My Firm",
    scanLabel: "Legal AI Scan",
    reportTitle: "Legal AI Visibility Report",
  },
  ecommerce: {
    heroTitle: "E-Commerce AI Visibility",
    heroSub: "Are AI shopping assistants recommending your products?",
    ctaLabel: "Scan My Store",
    scanLabel: "E-Commerce AI Scan",
    reportTitle: "E-Commerce AI Visibility Report",
  },
  other: {
    heroTitle: "AI Visibility Analysis",
    heroSub: "Can AI systems find and recommend you?",
    ctaLabel: "Scan My Site",
    scanLabel: "AI Scan",
    reportTitle: "AI Visibility Report",
  },
};

// ─── Trend chart ───────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  } catch { return "—"; }
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
          What sector is your business in?
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 26px", lineHeight: 1.5 }}>
          Select for sector-specific AI analysis
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
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Upgrade modal ─────────────────────────────────────────────────────────────
type UpgradeModalProps = {
  feature: string;
  onClose: () => void;
};

function UpgradeModal({ feature, onClose }: UpgradeModalProps) {
  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in upgrading my Genessa plan to access "${feature}". Could you share the details?`
  );
  const whatsappUrl = `https://wa.me/905325788737?text=${whatsappMessage}`;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#111827",
          border: "1px solid #1F2937",
          borderRadius: 16,
          padding: 32,
          maxWidth: 420,
          width: "100%",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#F9FAFB", marginBottom: 8, margin: "0 0 8px" }}>
            Upgrade to unlock
          </h2>
          <p style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 1.6, margin: 0 }}>
            <strong style={{ color: "#E5E7EB" }}>{feature}</strong> is available on Starter and Pro plans.
          </p>
        </div>

        {/* Plan comparison cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {/* Starter */}
          <div style={{ background: "#1F2937", border: "1px solid #3B82F6", borderRadius: 12, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#3B82F6", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Starter
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#F9FAFB" }}>$29</div>
            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>/month</div>
            <div style={{ fontSize: 12, color: "#D1D5DB", textAlign: "left" }}>
              ✓ Full insights<br/>
              ✓ Full checklist<br/>
              ✓ Scan history<br/>
              ✓ 2 scans/week
            </div>
          </div>
          {/* Pro */}
          <div style={{ background: "#1F2937", border: "1px solid #8B5CF6", borderRadius: 12, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#8B5CF6", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Pro
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#F9FAFB" }}>$79</div>
            <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>/month</div>
            <div style={{ fontSize: 12, color: "#D1D5DB", textAlign: "left" }}>
              ✓ Growth Audit<br/>
              ✓ PDF Export<br/>
              ✓ 1 domain<br/>
              ✓ 4 scans/week
            </div>
          </div>
        </div>

        {/* Agency line */}
        <p style={{ fontSize: 12, color: "#4B5563", textAlign: "center", marginBottom: 16, margin: "0 0 16px" }}>
          Need 10+ domains or white-label?{" "}
          <a href="/contact" style={{ color: "#F59E0B", textDecoration: "none", fontWeight: 600 }}>Contact us for Agency →</a>
        </p>

        {/* CTA buttons */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block", width: "100%",
            padding: "12px 0", borderRadius: 8,
            background: "#25D366", color: "#fff",
            fontWeight: 600, fontSize: 14,
            textAlign: "center", textDecoration: "none",
            marginBottom: 8,
            boxSizing: "border-box",
          }}
        >
          💬 Contact via WhatsApp
        </a>
        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 8,
            background: "transparent",
            color: "#6B7280", fontWeight: 500, fontSize: 14,
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
  const [plan, setPlan] = useState<Plan>("free");
  const [upgradeModal, setUpgradeModal] = useState<string | null>(null);
  const [showRescanUpsell, setShowRescanUpsell] = useState(false);
  const [scanHistoryLoaded, setScanHistoryLoaded] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [agencyDomains, setAgencyDomains] = useState<AgencyDomain[]>([]);
  const [addingEntity, setAddingEntity] = useState(false);
  const [newEntityDomain, setNewEntityDomain] = useState("");
  const [newEntityNickname, setNewEntityNickname] = useState("");
  const [newEntitySector, setNewEntitySector] = useState("other");
  const [savingEntity, setSavingEntity] = useState(false);

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
      .select("sector, plan")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const s = (data?.sector as string | null) ?? null;
        const p = normalizePlan(data?.plan as string);
        setSector(s);
        setPlan(p);
        setProfileLoaded(true);
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
      .limit(50)
      .then(({ data }) => {
        if (data) setScanHistory(data as ScanRecord[]);
        setScanHistoryLoaded(true);
      });
  }, [user]);

  useEffect(() => {
    if (!user || !profileLoaded) return;
    if (plan !== "agency" && plan !== "consulting") return;
    loadAgencyDomains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, plan, profileLoaded]);

  // Handle ?rescan=domain URL param
  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const rescanDomain = params.get("rescan");
    if (rescanDomain) {
      window.history.replaceState({}, "", "/dashboard");
      router.push(`/score?domain=${encodeURIComponent(rescanDomain)}`);
    }
  }, [user]);

  async function handleSectorSelect(selectedSector: string) {
    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("profiles")
      .upsert({ id: user!.id, sector: selectedSector }, { onConflict: "id" });
    setSector(selectedSector);
    setShowSectorModal(false);
  }

  async function loadAgencyDomains() {
    if (!user) return;
    const supabase = createSupabaseBrowserClient();
    const { data: domainRows } = await supabase
      .from("agency_domains")
      .select("id, domain, sector, nickname, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (!domainRows || domainRows.length === 0) {
      setAgencyDomains([]);
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

    const latestScan: Record<string, { readiness_score: number | null; authority_score: number | null; influence_score: number | null; created_at: string }> = {};
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

    setAgencyDomains(
      domainRows.map((r) => ({
        id: r.id as string,
        domain: r.domain as string,
        sector: r.sector as string | null,
        nickname: r.nickname as string | null,
        lastScan: latestScan[r.domain as string] ?? null,
      }))
    );
  }

  async function handleAddEntity() {
    if (!user || savingEntity) return;
    const trimmed = newEntityDomain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!trimmed || agencyDomains.length >= 10) return;
    setSavingEntity(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.from("agency_domains").insert({
      user_id: user.id,
      domain: trimmed,
      sector: newEntitySector || "other",
      nickname: newEntityNickname.trim() || null,
    });
    setNewEntityDomain("");
    setNewEntityNickname("");
    setNewEntitySector("other");
    setAddingEntity(false);
    setSavingEntity(false);
    await loadAgencyDomains();
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

  function handleNewScanClick() {
    if (profileLoaded && scanHistoryLoaded && !canRescan) {
      setUpgradeModal("More Scans");
      return;
    }
    setShowScan(true);
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

  const copy = sector ? (SECTOR_COPY[sector] ?? null) : null;
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

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const scansThisWeek = scanHistory.filter(s => +new Date(s.created_at) > sevenDaysAgo).length;
  const scansThisMonth = scanHistory.filter(s => +new Date(s.created_at) > thirtyDaysAgo).length;
  const unlimited = PLAN_LIMITS[plan].unlimitedScans as boolean;
  const weeklyLimit = PLAN_LIMITS[plan].scansPerWeek as number;
  const monthlyLimit = PLAN_LIMITS[plan].scansPerMonth as number;
  const canRescan = unlimited || (plan === "free" ? scansThisMonth < monthlyLimit : scansThisWeek < weeklyLimit);
  const scansRemaining = unlimited ? 99 : plan === "free"
    ? Math.max(0, monthlyLimit - scansThisMonth)
    : Math.max(0, weeklyLimit - scansThisWeek);

  return (
    <div style={{ color: "#111827" }}>

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

      {/* ── Upgrade modal ── */}
      {upgradeModal && (
        <UpgradeModal feature={upgradeModal} onClose={() => setUpgradeModal(null)} />
      )}

      <div style={{ padding: "36px 40px 80px" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 30 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#2952E3", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7, opacity: 0.7 }}>
              {copy?.heroSub ?? "AI Visibility Control Center"}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", margin: 0, color: "#111827" }}>
              {copy?.heroTitle ?? "Dashboard"}
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 10px", borderRadius: 20,
              fontSize: 11, fontWeight: 600,
              background: getPlanColor(plan) + "22",
              color: getPlanColor(plan),
              border: `1px solid ${getPlanColor(plan)}44`,
            }}>
              {getPlanLabel(plan)}
            </span>
            <button
              onClick={handleNewScanClick}
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
              {copy ? `+ ${copy.ctaLabel}` : "+ Run a scan"}
            </button>
          </div>
        </div>

        {/* ── Plan Banners ── */}
        {profileLoaded && plan === "free" && (
          <div style={{
            padding: "12px 18px", borderRadius: 12, marginBottom: 16,
            background: "#FFFBEB", border: "1px solid #FDE68A",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
          }}>
            <span style={{ fontSize: 13, color: "#92400E", fontWeight: 500 }}>
              You&apos;re on the <strong>Free plan</strong> — 1 scan per month · Limited insights
            </span>
            <button onClick={() => setUpgradeModal("Starter Plan")} style={{
              padding: "7px 14px", borderRadius: 8, background: "#7C3AED",
              color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: "none", fontFamily: "var(--font-geist-sans)",
            }}>
              Upgrade to Starter →
            </button>
          </div>
        )}
        {profileLoaded && plan === "starter" && (
          <div style={{
            padding: "12px 18px", borderRadius: 12, marginBottom: 16,
            background: "#EFF6FF", border: "1px solid #BFDBFE",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
          }}>
            <span style={{ fontSize: 13, color: "#1E40AF", fontWeight: 600 }}>
              Starter Plan · 2 scans/week
            </span>
            <span style={{ fontSize: 13, color: "#3B82F6", fontWeight: 500 }}>
              {scansRemaining} scan{scansRemaining !== 1 ? "s" : ""} remaining this week
            </span>
          </div>
        )}
        {profileLoaded && plan === "pro" && (
          <div style={{
            padding: "12px 18px", borderRadius: 12, marginBottom: 16,
            background: "#F5F3FF", border: "1px solid #DDD6FE",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
          }}>
            <span style={{ fontSize: 13, color: "#5B21B6", fontWeight: 600 }}>
              Pro Plan · 4 scans/week
            </span>
            <span style={{ fontSize: 13, color: "#7C3AED", fontWeight: 500 }}>
              {scansRemaining} scan{scansRemaining !== 1 ? "s" : ""} remaining this week
            </span>
          </div>
        )}
        {/* ── Engine Scores Panel (V2) ── */}
        <EngineScoresPanel />

        {profileLoaded && (plan === "agency" || plan === "consulting") && (
          <>
            <div style={{
              padding: "14px 20px", borderRadius: 12, marginBottom: 16,
              background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
              border: "1px solid #FDE68A",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 16 }}>🏢</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#92400E" }}>
                Enterprise Plan
              </span>
              <span style={{ fontSize: 13, color: "#B45309" }}>
                · {agencyDomains.length} {agencyDomains.length === 1 ? "entity" : "entities"} · Unlimited scans
              </span>
            </div>

            {/* My Entities */}
            <section style={{
              borderRadius: 16, padding: "20px 24px", marginBottom: 16,
              background: "#fff", border: "1px solid #E5E7EB",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>My Entities</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Businesses under your account</div>
                </div>
                <button
                  onClick={() => setAddingEntity(true)}
                  disabled={agencyDomains.length >= 10}
                  style={{
                    fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 8,
                    background: agencyDomains.length >= 10 ? "#F3F4F6" : "linear-gradient(135deg, #2952E3, #7B3FE4)",
                    color: agencyDomains.length >= 10 ? "#9CA3AF" : "#fff",
                    border: "none", cursor: agencyDomains.length >= 10 ? "not-allowed" : "pointer",
                    fontFamily: "var(--font-geist-sans)",
                  }}
                >
                  + Add Entity
                </button>
              </div>

              {/* Inline add form */}
              {addingEntity && (
                <div style={{
                  background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12,
                  padding: "14px 16px", marginBottom: 14,
                  display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end",
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "#6B7280", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                      Domain *
                    </label>
                    <input
                      autoFocus
                      type="text"
                      placeholder="example.com"
                      value={newEntityDomain}
                      onChange={(e) => setNewEntityDomain(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddEntity(); }}
                      style={{ padding: "7px 10px", fontSize: 13, border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", color: "#111827", outline: "none", width: 180, fontFamily: "var(--font-geist-sans)" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "#6B7280", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                      Name (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Client name"
                      value={newEntityNickname}
                      onChange={(e) => setNewEntityNickname(e.target.value)}
                      style={{ padding: "7px 10px", fontSize: 13, border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", color: "#111827", outline: "none", width: 150, fontFamily: "var(--font-geist-sans)" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "#6B7280", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                      Sector
                    </label>
                    <select
                      value={newEntitySector}
                      onChange={(e) => setNewEntitySector(e.target.value)}
                      style={{ padding: "7px 10px", fontSize: 13, border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", color: "#111827", outline: "none", width: 140, fontFamily: "var(--font-geist-sans)", cursor: "pointer" }}
                    >
                      {SECTORS.map((s) => (
                        <option key={s.key} value={s.key}>{s.emoji} {s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleAddEntity}
                      disabled={savingEntity || !newEntityDomain.trim()}
                      style={{
                        padding: "7px 18px", fontSize: 12, fontWeight: 600, borderRadius: 8, border: "none",
                        background: savingEntity || !newEntityDomain.trim() ? "#F3F4F6" : "linear-gradient(135deg, #2952E3, #7B3FE4)",
                        color: savingEntity || !newEntityDomain.trim() ? "#9CA3AF" : "#fff",
                        cursor: savingEntity || !newEntityDomain.trim() ? "not-allowed" : "pointer",
                        fontFamily: "var(--font-geist-sans)",
                      }}
                    >
                      {savingEntity ? "Adding…" : "Add"}
                    </button>
                    <button
                      onClick={() => { setAddingEntity(false); setNewEntityDomain(""); setNewEntityNickname(""); setNewEntitySector("other"); }}
                      style={{ padding: "7px 14px", fontSize: 12, fontWeight: 500, borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280", cursor: "pointer", fontFamily: "var(--font-geist-sans)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {agencyDomains.length === 0 && !addingEntity ? (
                <div style={{ padding: "24px 0", textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>
                    No entities yet. Click &ldquo;+ Add Entity&rdquo; to get started.
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                  {agencyDomains.map((entity) => (
                    <div key={entity.id} style={{
                      background: "#F8F9FC", border: "1px solid #E5E7EB", borderRadius: 12,
                      padding: "16px 16px 14px", display: "flex", flexDirection: "column",
                    }}>
                      {/* Header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                        <span style={{ fontSize: 16 }}>{SECTOR_EMOJI[entity.sector ?? "other"] ?? "🔧"}</span>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {entity.nickname || entity.domain}
                        </div>
                      </div>
                      {/* Domain + sector */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        {entity.nickname && (
                          <div style={{ fontSize: 11, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {entity.domain}
                          </div>
                        )}
                        <div style={{ fontSize: 10, color: "#6B7280", marginLeft: "auto" }}>
                          {SECTORS.find(s => s.key === entity.sector)?.label ?? "Other"}
                        </div>
                      </div>
                      {/* Scores */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: "10px 12px", background: "#fff", borderRadius: 8, border: "1px solid #F3F4F6", marginBottom: 10 }}>
                        {[
                          { label: "Readiness", score: entity.lastScan?.readiness_score },
                          { label: "Authority",  score: entity.lastScan?.authority_score },
                          { label: "Influence",  score: entity.lastScan?.influence_score },
                        ].map(({ label, score }) => (
                          <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 11, color: "#6B7280" }}>{label}</span>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                              background: scoreBg(score), color: scoreColor(score),
                              fontFamily: "var(--font-geist-mono)",
                            }}>
                              {score != null ? score : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                      {/* Last scan */}
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 12 }}>
                        Last scan: {entity.lastScan ? formatDate(entity.lastScan.created_at) : "Never scanned"}
                      </div>
                      {/* Actions */}
                      <div style={{ display: "flex", gap: 7, marginTop: "auto" }}>
                        <button
                          onClick={() => router.push(`/score?domain=${encodeURIComponent(entity.domain)}${entity.sector ? `&sector=${entity.sector}` : ""}`)}
                          style={{
                            flex: 1, padding: "7px 0", fontSize: 11, fontWeight: 600, borderRadius: 7, border: "none",
                            background: "linear-gradient(135deg, #2952E3, #7B3FE4)", color: "#fff",
                            cursor: "pointer", fontFamily: "var(--font-geist-sans)",
                          }}
                        >
                          🔍 Scan
                        </button>
                        <Link
                          href={`/dashboard/entity/${encodeURIComponent(entity.domain)}`}
                          style={{
                            flex: 1, padding: "7px 0", fontSize: 11, fontWeight: 600, borderRadius: 7,
                            border: "1px solid #DDD6FE", background: "#F5F3FF", color: "#7C3AED",
                            textDecoration: "none", textAlign: "center" as const,
                          }}
                        >
                          📊 View Report
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

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
              onClick={handleNewScanClick}
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
              {copy ? `${copy.ctaLabel} →` : "Scan your first domain →"}
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
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>· Last scan</span>
              </div>
              <button
                onClick={() => {
                  if (!pendingScan) return;
                  if (canRescan) {
                    router.push(`/score?domain=${encodeURIComponent(pendingScan.domain)}`);
                  } else {
                    setShowRescanUpsell((v) => !v);
                  }
                }}
                style={{
                  fontSize: 12, fontWeight: 600,
                  color: "#2952E3",
                  background: "rgba(41,82,227,0.06)",
                  border: "1px solid rgba(41,82,227,0.15)",
                  borderRadius: 8, padding: "6px 16px",
                  cursor: "pointer",
                  fontFamily: "var(--font-geist-sans)",
                }}
              >
                Rescan
              </button>
            </div>

            {/* Rescan upsell */}
            {showRescanUpsell && !canRescan && (
              <div style={{
                padding: "16px 20px", borderRadius: 12,
                background: "#FFFBEB", border: "1px solid #FDE68A",
              }}>
                <p style={{ fontSize: 13, color: "#92400E", lineHeight: 1.6, margin: "0 0 12px" }}>
                  {plan === "free" ? (
                    <>🚀 You&apos;ve used your free scan this month.<br /><strong>Upgrade to Starter</strong> for 2 scans/week + full insights — $29/mo</>
                  ) : (
                    <>You&apos;ve used your {weeklyLimit} scans this week.<br />Upgrade to Pro for 4 scans/week — $79/mo</>
                  )}
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => { setShowRescanUpsell(false); setUpgradeModal("More Scans"); }}
                    style={{ padding: "8px 16px", borderRadius: 8, background: "#7C3AED", color: "#fff", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "var(--font-geist-sans)" }}
                  >
                    Upgrade Now
                  </button>
                  <button
                    onClick={() => { setShowRescanUpsell(false); router.push(`/score?domain=${encodeURIComponent(pendingScan!.domain)}`); }}
                    style={{ padding: "8px 16px", borderRadius: 8, background: "#fff", color: "#6B7280", fontSize: 12, fontWeight: 500, border: "1px solid #E5E7EB", cursor: "pointer", fontFamily: "var(--font-geist-sans)" }}
                  >
                    Continue anyway
                  </button>
                </div>
              </div>
            )}

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
                    ? (
                      <>
                        {(["this_week", "this_month", "long_term"] as const).map((priority, gi) => {
                          const items = sectorChecklist.filter(c => c.priority === priority);
                          if (!items.length) return null;
                          const groupLabel = priority === "this_week" ? "🔥 This Week" : priority === "this_month" ? "📅 This Month" : "🎯 Long Term";
                          const isNonFreeGroup = priority !== "this_week";
                          const isGated = isNonFreeGroup && !canAccess(plan, "checklistFull");
                          return (
                            <div key={priority}>
                              <div style={{
                                fontSize: 11, fontWeight: 700, color: "#9CA3AF",
                                textTransform: "uppercase", letterSpacing: "0.09em",
                                marginTop: gi === 0 ? 0 : 12, marginBottom: 2,
                              }}>
                                {groupLabel}
                              </div>
                              <div style={{ position: "relative" }}>
                                <div style={isGated ? { filter: "blur(3px)", pointerEvents: "none", opacity: 0.5 } : undefined}>
                                  {items.map(item => (
                                    <ChecklistItem key={item.label} done={false} label={item.label} points={item.points} locked={isGated} />
                                  ))}
                                </div>
                                {isGated && (
                                  <div
                                    onClick={() => setUpgradeModal("Full Checklist")}
                                    style={{
                                      position: "absolute", inset: 0,
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <span style={{
                                      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                                      background: "#FEF9C3", border: "1px solid #FDE047", color: "#A16207",
                                      letterSpacing: "0.06em",
                                    }}>
                                      🔒 Premium
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    ) : (
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

            {/* ── Growth Audit link ── */}
            <Link
              href="/dashboard/growth-audit"
              style={{ textDecoration: "none" }}
            >
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", borderRadius: 14,
                background: "#111827", border: "1px solid #1F2937",
                cursor: "pointer",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: "linear-gradient(135deg, #2952E3, #7B3FE4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#F9FAFB" }}>Growth Audit</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>Multi-agent AI analysis</div>
                  </div>
                </div>
                <span style={{ fontSize: 18, color: "#4B5563" }}>→</span>
              </div>
            </Link>


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

            {/* Scan History link */}
            <Link href="/dashboard/scan-history" style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px", borderRadius: 14,
                background: "#fff", border: "1px solid #E5E7EB",
                cursor: "pointer",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>📋</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Scan History</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>
                      {scanHistory.length > 0 ? `${scanHistory.length} scan${scanHistory.length !== 1 ? "s" : ""}` : "No scans yet"}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 16, color: "#9CA3AF" }}>→</span>
              </div>
            </Link>

          </div>
        )}
      </div>
    </div>
  );
}
