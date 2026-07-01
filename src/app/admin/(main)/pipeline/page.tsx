import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui/page-header";
import { StatCard } from "@/components/admin/ui/stat-card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

export const metadata: Metadata = { title: "Pipeline" };

const SECTOR_EMOJI: Record<string, string> = {
  restaurant: "🍽️",
  hotel: "🏨",
  clinic: "🏥",
  saas: "💻",
  ecommerce: "🛒",
  creator: "🎨",
  legal: "⚖️",
  other: "🔧",
};

function scoreColor(score: number | null) {
  if (score === null) return "#9CA3AF";
  if (score <= 40) return "#EF4444";
  if (score <= 70) return "#F59E0B";
  return "#10B981";
}

function ScorePill({ score }: { score: number | null }) {
  if (score === null) return <span style={{ fontSize: 11, color: "#9CA3AF" }}>—</span>;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(score), background: `${scoreColor(score)}18`, padding: "2px 7px", borderRadius: 20 }}>
      {score}
    </span>
  );
}

function KanbanCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #1F2937", background: "#0D1117", marginBottom: 8 }}>
      {children}
    </div>
  );
}

function KanbanColumn({ title, count, color, children }: { title: string; count: number; color: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: "1 1 0", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color }}>{title}</span>
        <span style={{ fontSize: 11, fontWeight: 600, background: `${color}20`, color, padding: "1px 7px", borderRadius: 20 }}>{count}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

type LeadCard = { id: string; domain: string; sector: string | null; email: string | null; score: number | null; date: string };
type ScanCard = { domain: string; userId: string; sector: string | null; score: number | null; date: string };
type CustomerCard = { userId: string; domain: string | null; sector: string | null; plan: string; date: string };

export default async function PipelinePage() {
  const admin = createSupabaseAdminClient();

  let leadsData: LeadCard[] = [];
  let scannedData: ScanCard[] = [];
  let hotData: ScanCard[] = [];
  let customerData: CustomerCard[] = [];

  if (admin) {
    const [leadsRes, scansRes, profilesRes] = await Promise.all([
      admin.from("leads").select("id, domain, sector, email, score_snapshot, created_at").order("created_at", { ascending: false }),
      admin.from("scans").select("domain, user_id, readiness_score, created_at").not("user_id", "is", null).order("created_at", { ascending: false }),
      admin.from("profiles").select("id, plan, sector, created_at"),
    ]);

    const leads = (leadsRes.data ?? []) as { id: string; domain: string; sector: string | null; email: string | null; score_snapshot: number | null; created_at: string }[];
    const scans = (scansRes.data ?? []) as { domain: string; user_id: string; readiness_score: number | null; created_at: string }[];
    const profiles = (profilesRes.data ?? []) as { id: string; plan: string; sector: string | null; created_at: string }[];

    // Latest scan per domain
    const latestScanByDomain = new Map<string, typeof scans[number]>();
    for (const s of scans) {
      if (!latestScanByDomain.has(s.domain)) latestScanByDomain.set(s.domain, s);
    }

    // Latest scan per user
    const latestScanByUser = new Map<string, typeof scans[number]>();
    for (const s of scans) {
      if (!latestScanByUser.has(s.user_id)) latestScanByUser.set(s.user_id, s);
    }

    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    // Scanned domain set (for LEADS filtering)
    const scannedDomains = new Set(latestScanByDomain.keys());

    // LEADS: leads table entries whose domain has no scan
    leadsData = leads
      .filter((l) => !scannedDomains.has(l.domain))
      .map((l) => ({
        id: l.id,
        domain: l.domain,
        sector: l.sector,
        email: l.email,
        score: l.score_snapshot,
        date: l.created_at,
      }));

    // SCANNED + HOT PROSPECT: users with scans, free plan
    for (const [, scan] of latestScanByDomain.entries()) {
      const profile = profileMap.get(scan.user_id);
      if (!profile || (profile.plan !== "free" && profile.plan !== "premium" && profile.plan !== "agency")) continue;
      if (profile.plan !== "free") continue;
      const score = scan.readiness_score;
      const card: ScanCard = { domain: scan.domain, userId: scan.user_id, sector: profile.sector, score, date: scan.created_at };
      if (score !== null && score >= 70) hotData.push(card);
      else scannedData.push(card);
    }

    // CUSTOMER: premium or agency plan
    for (const p of profiles) {
      if (p.plan !== "premium" && p.plan !== "agency") continue;
      const scan = latestScanByUser.get(p.id);
      customerData.push({
        userId: p.id,
        domain: scan?.domain ?? null,
        sector: p.sector,
        plan: p.plan,
        date: p.created_at,
      });
    }
  }

  const waMessage = (domain: string, score: number | null) =>
    `https://wa.me/905325788737?text=${encodeURIComponent(`Hi! Your AI visibility score is ${score ?? "?"}/100. You're one step away from unlocking Growth Audit and full optimization. Want to upgrade to Premium?`)}`;

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader title="Pipeline" description="Sales funnel view — Leads → Scanned → Hot Prospect → Customer" />

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <StatCard label="Leads" value={String(leadsData.length)} />
        <StatCard label="Scanned" value={String(scannedData.length)} />
        <StatCard label="Hot Prospect" value={String(hotData.length)} hint="free + score ≥ 70" />
        <StatCard label="Customers" value={String(customerData.length)} hint="premium / agency" />
      </div>

      {/* Kanban */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", overflowX: "auto" }}>
        {/* LEADS */}
        <KanbanColumn title="Leads" count={leadsData.length} color="#6B7280">
          {leadsData.length === 0 ? <p style={{ fontSize: 12, color: "#6B7280" }}>No leads yet</p> : null}
          {leadsData.map((l) => (
            <KanbanCard key={l.id}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#E5E7EB", marginBottom: 2 }}>{l.domain}</p>
              {l.email && <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>{l.email}</p>}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {l.sector && <span style={{ fontSize: 12 }}>{SECTOR_EMOJI[l.sector] ?? "🔧"} {l.sector}</span>}
                {l.score !== null && <ScorePill score={l.score} />}
                <span style={{ fontSize: 11, color: "#6B7280", marginLeft: "auto" }}>{formatDate(l.date)}</span>
              </div>
            </KanbanCard>
          ))}
        </KanbanColumn>

        {/* SCANNED */}
        <KanbanColumn title="Scanned" count={scannedData.length} color="#F59E0B">
          {scannedData.length === 0 ? <p style={{ fontSize: 12, color: "#6B7280" }}>No records</p> : null}
          {scannedData.map((s) => (
            <KanbanCard key={s.domain + s.userId}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#E5E7EB", marginBottom: 4 }}>{s.domain}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {s.sector && <span style={{ fontSize: 12 }}>{SECTOR_EMOJI[s.sector] ?? "🔧"} {s.sector}</span>}
                <ScorePill score={s.score} />
                <span style={{ fontSize: 11, color: "#6B7280", marginLeft: "auto" }}>{formatDate(s.date)}</span>
              </div>
            </KanbanCard>
          ))}
        </KanbanColumn>

        {/* HOT PROSPECT */}
        <KanbanColumn title="Hot Prospect" count={hotData.length} color="#10B981">
          {hotData.length === 0 ? <p style={{ fontSize: 12, color: "#6B7280" }}>No records</p> : null}
          {hotData.map((s) => (
            <KanbanCard key={s.domain + s.userId}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#E5E7EB", marginBottom: 4 }}>{s.domain}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {s.sector && <span style={{ fontSize: 12 }}>{SECTOR_EMOJI[s.sector] ?? "🔧"} {s.sector}</span>}
                <ScorePill score={s.score} />
                <span style={{ fontSize: 11, color: "#6B7280", marginLeft: "auto" }}>{formatDate(s.date)}</span>
              </div>
              <a
                href={waMessage(s.domain, s.score)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#10B981", background: "#10B98118", padding: "3px 10px", borderRadius: 20, textDecoration: "none" }}
              >
                💬 Upgrade Offer
              </a>
            </KanbanCard>
          ))}
        </KanbanColumn>

        {/* CUSTOMER */}
        <KanbanColumn title="Customer" count={customerData.length} color="#818CF8">
          {customerData.length === 0 ? <p style={{ fontSize: 12, color: "#6B7280" }}>No customers yet</p> : null}
          {customerData.map((c) => (
            <KanbanCard key={c.userId}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#E5E7EB", marginBottom: 2 }}>{c.domain ?? c.userId.slice(0, 8) + "…"}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {c.sector && <span style={{ fontSize: 12 }}>{SECTOR_EMOJI[c.sector] ?? "🔧"} {c.sector}</span>}
                <span style={{ fontSize: 11, fontWeight: 600, color: "#818CF8", background: "#818CF818", padding: "1px 7px", borderRadius: 20, textTransform: "capitalize" }}>{c.plan}</span>
                <span style={{ fontSize: 11, color: "#6B7280", marginLeft: "auto" }}>{formatDate(c.date)}</span>
              </div>
            </KanbanCard>
          ))}
        </KanbanColumn>
      </div>
    </div>
  );
}
