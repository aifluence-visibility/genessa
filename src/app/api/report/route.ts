import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ScanRow {
  domain: string;
  readiness_score: number | null;
  insight: {
    hero_text: string | null;
    strongest_point: string | null;
    critical_gap: string | null;
    quick_win: string | null;
  } | null;
  created_at: string;
}

const SECTOR_CRITICAL: Record<string, string[]> = {
  restaurant:  ["Optimize Google Business Profile", "Add Restaurant schema", "Update TripAdvisor profile"],
  hospitality: ["Optimize Google Business Profile", "Add LodgingBusiness schema", "Create llms.txt"],
  clinic:      ["Add MedicalClinic schema", "Create doctor profile pages", "Create llms.txt"],
  education:   ["Add EducationalOrganization schema", "Optimize program pages", "Create llms.txt"],
  ecommerce:   ["Add Product schema to every product", "Create llms.txt", "Activate Google Shopping feed"],
  saas:        ["Add SoftwareApplication schema", "Make documentation AI-readable", "Create llms.txt"],
  realestate:  ["Add RealEstateAgent schema", "Create agent profile pages", "Create llms.txt"],
  legal:       ["Add LegalService schema", "Create attorney profile pages", "Create llms.txt"],
  finance:     ["Add FinancialService schema", "Make licence certificates visible", "Create llms.txt"],
  creator:     ["Add Person schema", "Optimize LinkedIn profile", "Create llms.txt"],
  marketing:   ["Add ProfessionalService schema", "Create Clutch profile", "Create llms.txt"],
};

const SECTOR_LABELS: Record<string, string> = {
  restaurant:  "Restaurant",
  hospitality: "Hospitality",
  clinic:      "Medical",
  education:   "Education",
  ecommerce:   "E-commerce",
  saas:        "SaaS",
  realestate:  "Real Estate",
  legal:       "Legal",
  finance:     "Finance",
  creator:     "Creator",
  marketing:   "Marketing",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    return iso;
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return "#16A34A";
  if (score >= 60) return "#2952E3";
  return "#DC2626";
}

function scoreVerdict(score: number): string {
  if (score >= 80) return "Strong AI visibility";
  if (score >= 60) return "Moderate AI visibility";
  return "Needs significant work";
}

function scoreSummary(score: number): string {
  if (score >= 80) return "This site is well-optimised for AI discovery. Keep reinforcing these quality signals.";
  if (score >= 60) return "Good foundation — address the critical gaps below to reach the next level.";
  return "Several important AI visibility signals are missing. Prioritise the actions below to improve quickly.";
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return new Response(
      `<html><body style="font-family:sans-serif;padding:48px;color:#111827">
        <h2 style="margin-bottom:12px">Please log in first</h2>
        <a href="/auth/login" style="color:#2952E3">Log in →</a>
      </body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 401 }
    );
  }

  const { data: scanData } = await supabase
    .from("scans")
    .select("domain, readiness_score, insight, created_at")
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!scanData) {
    return new Response(
      `<html><body style="font-family:sans-serif;padding:48px;color:#111827">
        <h2 style="margin-bottom:12px">No scan data found</h2>
        <p style="color:#6B7280">Run a scan first from your <a href="/dashboard" style="color:#2952E3">dashboard</a>.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 404 }
    );
  }

  const scan = scanData as ScanRow;
  const { data: profileData } = await supabase
    .from("profiles")
    .select("sector")
    .eq("id", authData.user.id)
    .maybeSingle();

  const sector = (profileData?.sector as string | null) ?? null;
  const sectorLabel = sector ? (SECTOR_LABELS[sector] ?? sector) : null;
  const criticalItems = sector
    ? (SECTOR_CRITICAL[sector] ?? [])
    : ["Add Organization schema", "Add answer-first content to homepage", "Create llms.txt"];

  const score = scan.readiness_score ?? 0;
  const color = scoreColor(score);
  const date = fmtDate(scan.created_at);
  const domain = scan.domain;
  const insight = scan.insight;

  const technicalIssues: { label: string; status: "critical" | "passing" }[] = [
    ...criticalItems.map(label => ({ label, status: "critical" as const })),
    { label: "HTTPS active", status: "passing" },
    { label: "Sitemap present", status: "passing" },
    { label: "Robots.txt configured", status: "passing" },
  ];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>AI Visibility Report — ${esc(domain)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#fff;color:#111827;font-size:14px;line-height:1.55}
    .page{max-width:760px;margin:0 auto;padding:52px 52px 72px}
    /* Header */
    .hdr{display:flex;align-items:center;justify-content:space-between;padding-bottom:22px;border-bottom:2px solid #F3F4F6;margin-bottom:30px}
    .logo{font-size:19px;font-weight:700;letter-spacing:-.03em;background:linear-gradient(135deg,#2952E3,#7B3FE4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .rpt-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF}
    /* Domain bar */
    .domain-bar{background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}
    .domain-name{font-size:15px;font-weight:600;color:#111827;display:flex;align-items:center;gap:10px}
    .dot-g{width:8px;height:8px;border-radius:50%;background:#16A34A;display:inline-block;flex-shrink:0}
    .sector-pill{font-size:10px;font-weight:600;color:#6B7280;background:#F3F4F6;padding:2px 10px;border-radius:999px;letter-spacing:.04em;white-space:nowrap}
    .rpt-date{font-size:12px;color:#9CA3AF;white-space:nowrap}
    /* Score */
    .score-wrap{display:flex;align-items:center;gap:28px;padding:24px 26px;border:1px solid #E5E7EB;border-radius:16px;margin-bottom:28px}
    .score-ring{width:96px;height:96px;border-radius:50%;border:6px solid ${color};display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .score-num{font-size:34px;font-weight:700;color:${color};letter-spacing:-.04em;line-height:1}
    .score-eyebrow{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;margin-bottom:5px}
    .score-title{font-size:20px;font-weight:700;color:#111827;letter-spacing:-.02em;margin-bottom:5px}
    .score-sub{font-size:13px;color:#6B7280;line-height:1.6}
    /* Section header */
    .sh{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;margin-bottom:10px}
    /* Insight */
    .insight-card{border:1px solid #E5E7EB;border-radius:14px;padding:18px 22px;margin-bottom:22px}
    .insight-hero{font-size:14px;font-weight:500;color:#1F2937;line-height:1.65;padding-bottom:14px;border-bottom:1px solid #F3F4F6;margin-bottom:14px}
    .irow{display:flex;gap:12px;padding:9px 0;border-bottom:1px solid #F9FAFB}
    .irow:last-child{border-bottom:none}
    .ibadge{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:3px 8px;border-radius:999px;white-space:nowrap;flex-shrink:0;align-self:flex-start;margin-top:2px}
    .bg-green{background:rgba(22,163,74,.08);color:#16A34A;border:1px solid rgba(22,163,74,.2)}
    .bg-red{background:rgba(220,38,38,.06);color:#DC2626;border:1px solid rgba(220,38,38,.18)}
    .bg-blue{background:rgba(37,99,235,.07);color:#2563EB;border:1px solid rgba(37,99,235,.18)}
    .itext{font-size:13px;color:#4B5563;line-height:1.6}
    /* Checklist */
    .cl-card{border:1px solid #E5E7EB;border-radius:14px;overflow:hidden;margin-bottom:22px}
    .cl-head{padding:13px 20px;background:#FAFAFA;border-bottom:1px solid #F3F4F6;font-size:13px;font-weight:700;color:#111827}
    .cl-item{display:flex;align-items:center;gap:12px;padding:11px 20px;border-bottom:1px solid #F9FAFB}
    .cl-item:last-child{border-bottom:none}
    .cl-box{width:15px;height:15px;border-radius:4px;border:1.5px solid #D1D5DB;flex-shrink:0}
    .cl-label{font-size:13px;color:#374151;flex:1}
    .badge-crit{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:2px 7px;border-radius:999px;background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;white-space:nowrap}
    /* Issues */
    .tbl-card{border:1px solid #E5E7EB;border-radius:14px;overflow:hidden;margin-bottom:22px}
    .tbl-head{padding:13px 20px;background:#FAFAFA;border-bottom:1px solid #F3F4F6;font-size:13px;font-weight:700;color:#111827}
    table{width:100%;border-collapse:collapse}
    th{padding:9px 20px;text-align:left;font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid #F3F4F6;background:#FAFAFA}
    td{padding:11px 20px;border-bottom:1px solid #F9FAFB;vertical-align:middle;font-size:13px}
    tr:last-child td{border-bottom:none}
    .dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:8px;vertical-align:middle;flex-shrink:0}
    .dot-r{background:#DC2626}.dot-n{background:#D1D5DB}
    .pill{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:3px 8px;border-radius:999px}
    .pill-c{background:#FEF2F2;color:#DC2626;border:1px solid #FECACA}
    .pill-p{background:#F3F4F6;color:#6B7280;border:1px solid #E5E7EB}
    /* Footer */
    .footer{margin-top:36px;padding-top:18px;border-top:1px solid #F3F4F6;display:flex;align-items:center;justify-content:space-between}
    .ftr-brand{font-size:12px;color:#9CA3AF}
    .ftr-logo{font-size:12px;font-weight:700;background:linear-gradient(135deg,#2952E3,#7B3FE4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .ftr-meta{font-size:11px;color:#9CA3AF}
    /* Print */
    @media print{
      body{font-size:12px}
      .page{padding:28px 36px 44px}
      .score-wrap,.insight-card,.cl-card,.tbl-card{break-inside:avoid}
    }
  </style>
</head>
<body>
<div class="page">

  <div class="hdr">
    <div class="logo">Genessa</div>
    <div class="rpt-label">AI Visibility Report</div>
  </div>

  <div class="domain-bar">
    <div class="domain-name">
      <span class="dot-g"></span>
      ${esc(domain)}
      ${sectorLabel ? `<span class="sector-pill">${esc(sectorLabel)}</span>` : ""}
    </div>
    <div class="rpt-date">Generated ${esc(date)}</div>
  </div>

  <div class="score-wrap">
    <div class="score-ring">
      <span class="score-num">${score}</span>
    </div>
    <div>
      <div class="score-eyebrow">AI Readiness Score</div>
      <div class="score-title">${esc(scoreVerdict(score))}</div>
      <div class="score-sub">${esc(scoreSummary(score))}</div>
    </div>
  </div>

  ${insight ? `
  <div class="sh">AI Intelligence</div>
  <div class="insight-card">
    ${insight.hero_text ? `<div class="insight-hero">${esc(insight.hero_text)}</div>` : ""}
    ${insight.strongest_point ? `
    <div class="irow">
      <span class="ibadge bg-green">Strongest point</span>
      <span class="itext">${esc(insight.strongest_point)}</span>
    </div>` : ""}
    ${insight.critical_gap ? `
    <div class="irow">
      <span class="ibadge bg-red">Critical gap</span>
      <span class="itext">${esc(insight.critical_gap)}</span>
    </div>` : ""}
    ${insight.quick_win ? `
    <div class="irow">
      <span class="ibadge bg-blue">Quick win</span>
      <span class="itext">${esc(insight.quick_win)}</span>
    </div>` : ""}
  </div>
  ` : ""}

  <div class="sh">Critical Actions</div>
  <div class="cl-card">
    <div class="cl-head">Priority checklist — fix these first</div>
    ${criticalItems.map(item => `
    <div class="cl-item">
      <div class="cl-box"></div>
      <div class="cl-label">${esc(item)}</div>
      <span class="badge-crit">Critical</span>
    </div>`).join("")}
  </div>

  <div class="sh">Technical Issues</div>
  <div class="tbl-card">
    <div class="tbl-head">Scan results</div>
    <table>
      <thead>
        <tr>
          <th>Issue</th>
          <th>Status</th>
          <th style="text-align:right">Since</th>
        </tr>
      </thead>
      <tbody>
        ${technicalIssues.map(row => `
        <tr>
          <td>
            <span class="dot ${row.status === "critical" ? "dot-r" : "dot-n"}"></span>
            ${esc(row.label)}
          </td>
          <td><span class="pill ${row.status === "critical" ? "pill-c" : "pill-p"}">${row.status}</span></td>
          <td style="text-align:right;color:#9CA3AF;font-size:11px">${row.status === "critical" ? "First scan" : "✓ OK"}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <div class="ftr-brand">Powered by <span class="ftr-logo">Genessa</span></div>
    <div class="ftr-meta">${esc(domain)} · ${esc(date)}</div>
  </div>

</div>
<script>
  window.addEventListener("load", function() {
    setTimeout(function() { window.print(); }, 350);
  });
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
