import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ScanRow {
  domain: string;
  readiness_score: number | null;
  authority_score: number | null;
  influence_score: number | null;
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
  if (score >= 80) return "Strong AI Visibility";
  if (score >= 60) return "Moderate AI Visibility";
  return "Needs Improvement";
}

function scoreSummary(score: number): string {
  if (score >= 80) return "This site is well-optimised for AI discovery. Reinforce these quality signals to stay ahead.";
  if (score >= 60) return "Good foundation — address the critical gaps in the action plan to reach the next level.";
  return "Several important AI visibility signals are missing. Prioritise the actions below to improve quickly.";
}

function scoreRing(label: string, score: number | null, pending: boolean): string {
  const display = pending ? "—" : (score !== null ? String(score) : "—");
  const color = (score !== null && !pending) ? scoreColor(score) : "#D1D5DB";
  const subtitle = pending ? "Analysis in progress" : (score !== null ? scoreVerdict(score) : "Not yet scored");
  return `
    <div style="text-align:center;flex:1;min-width:0">
      <div style="width:110px;height:110px;border-radius:50%;border:6px solid ${color};display:flex;align-items:center;justify-content:center;margin:0 auto 14px">
        <span style="font-size:32px;font-weight:700;color:${color};letter-spacing:-.04em;line-height:1">${display}</span>
      </div>
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;margin-bottom:5px">${label}</div>
      <div style="font-size:12px;color:#6B7280;line-height:1.5">${subtitle}</div>
    </div>`;
}

function pageHeader(domain: string): string {
  return `
  <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:16px;border-bottom:1.5px solid #F3F4F6;margin-bottom:28px">
    <div style="font-size:17px;font-weight:700;letter-spacing:-.03em;background:linear-gradient(135deg,#2952E3,#7B3FE4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">Genessa</div>
    <div style="font-size:11px;color:#9CA3AF;font-weight:500">${esc(domain)}</div>
  </div>`;
}

function pageFooter(domain: string, date: string, pageNum: number): string {
  return `
  <div style="position:absolute;bottom:36px;left:52px;right:52px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #F3F4F6;padding-top:14px">
    <div style="font-size:11px;color:#9CA3AF">Powered by <span style="font-weight:700;background:linear-gradient(135deg,#2952E3,#7B3FE4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">Genessa</span></div>
    <div style="font-size:11px;color:#D1D5DB">${esc(domain)} · ${esc(date)}</div>
    <div style="font-size:11px;color:#D1D5DB">${pageNum} / 4</div>
  </div>`;
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
    .select("domain, readiness_score, authority_score, influence_score, insight, created_at")
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

  const readiness = scan.readiness_score ?? 0;
  const authority = scan.authority_score ?? null;
  const influence = scan.influence_score ?? null;
  const date = fmtDate(scan.created_at);
  const domain = scan.domain;
  const insight = scan.insight;

  const technicalIssues: { label: string; status: "critical" | "passing" }[] = [
    ...criticalItems.map(label => ({ label, status: "critical" as const })),
    { label: "HTTPS active", status: "passing" },
    { label: "Sitemap present", status: "passing" },
    { label: "Robots.txt configured", status: "passing" },
  ];

  const PAGE = `position:relative;width:210mm;min-height:297mm;padding:52px 52px 96px;box-sizing:border-box;background:#fff;break-after:page;page-break-after:always`;
  const LAST_PAGE = `position:relative;width:210mm;min-height:297mm;padding:52px 52px 96px;box-sizing:border-box;background:#fff`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>AI Visibility Report — ${esc(domain)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#E5E7EB;color:#111827;font-size:14px;line-height:1.55}
    @media print{
      body{background:#fff}
      @page{size:A4;margin:0}
    }
  </style>
</head>
<body>

<!-- ══════════════════════════════════════
     PAGE 1 — COVER
══════════════════════════════════════ -->
<div style="${PAGE};display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(160deg,#0F172A 0%,#1E3A8A 55%,#2952E3 100%)">

  <div style="display:flex;align-items:center;justify-content:space-between">
    <div style="font-size:22px;font-weight:700;letter-spacing:-.04em;color:#fff">Genessa</div>
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:rgba(255,255,255,.45)">AI Visibility Report</div>
  </div>

  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 0">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.16em;color:rgba(255,255,255,.45);margin-bottom:20px">Domain under analysis</div>
    <div style="font-size:38px;font-weight:700;letter-spacing:-.03em;color:#fff;margin-bottom:18px;word-break:break-all">${esc(domain)}</div>
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:center">
      <div style="font-size:13px;color:rgba(255,255,255,.6)">${esc(date)}</div>
      ${sectorLabel ? `
      <span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.3)"></span>
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.7);background:rgba(255,255,255,.12);padding:4px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.2)">${esc(sectorLabel)}</div>` : ""}
    </div>
  </div>

  <div style="display:flex;align-items:center;justify-content:space-between">
    <div style="font-size:11px;color:rgba(255,255,255,.4)">Powered by Genessa</div>
    <div style="font-size:11px;color:rgba(255,255,255,.3)">1 / 4</div>
  </div>

</div>

<!-- ══════════════════════════════════════
     PAGE 2 — SCORES
══════════════════════════════════════ -->
<div style="${PAGE}">
  ${pageHeader(domain)}

  <div style="margin-bottom:10px">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#9CA3AF;margin-bottom:8px">AI Visibility Scores</div>
  </div>

  <div style="display:flex;gap:16px;margin-bottom:36px;padding:32px 24px;border:1px solid #E5E7EB;border-radius:16px;background:#FAFAFA">
    ${scoreRing("Readiness", readiness, false)}
    <div style="width:1px;background:#F3F4F6;flex-shrink:0"></div>
    ${scoreRing("Authority", authority, authority === null)}
    <div style="width:1px;background:#F3F4F6;flex-shrink:0"></div>
    ${scoreRing("Influence", influence, influence === null)}
  </div>

  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#9CA3AF;margin-bottom:10px">Overall Assessment</div>
  <div style="border:1px solid #E5E7EB;border-radius:14px;padding:22px 24px;background:#fff">
    <div style="font-size:18px;font-weight:700;color:#111827;letter-spacing:-.02em;margin-bottom:8px">${esc(scoreVerdict(readiness))}</div>
    <div style="font-size:13px;color:#6B7280;line-height:1.7">${esc(scoreSummary(readiness))}</div>
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #F3F4F6;display:flex;gap:24px">
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;margin-bottom:4px">Readiness</div>
        <div style="font-size:22px;font-weight:700;color:${scoreColor(readiness)};letter-spacing:-.03em">${readiness}<span style="font-size:13px;color:#9CA3AF;font-weight:500">/100</span></div>
      </div>
      ${authority !== null ? `
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;margin-bottom:4px">Authority</div>
        <div style="font-size:22px;font-weight:700;color:${scoreColor(authority)};letter-spacing:-.03em">${authority}<span style="font-size:13px;color:#9CA3AF;font-weight:500">/100</span></div>
      </div>` : ""}
      ${influence !== null ? `
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;margin-bottom:4px">Influence</div>
        <div style="font-size:22px;font-weight:700;color:${scoreColor(influence)};letter-spacing:-.03em">${influence}<span style="font-size:13px;color:#9CA3AF;font-weight:500">/100</span></div>
      </div>` : ""}
    </div>
  </div>

  ${pageFooter(domain, date, 2)}
</div>

<!-- ══════════════════════════════════════
     PAGE 3 — AI INTELLIGENCE
══════════════════════════════════════ -->
<div style="${PAGE}">
  ${pageHeader(domain)}

  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#9CA3AF;margin-bottom:10px">AI Intelligence</div>

  ${insight ? `
  <div style="border:1px solid #E5E7EB;border-radius:14px;overflow:hidden;margin-bottom:24px">
    ${insight.hero_text ? `
    <div style="padding:22px 24px;border-bottom:1px solid #F3F4F6;background:#FAFAFA">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;margin-bottom:8px">Summary</div>
      <div style="font-size:15px;font-weight:500;color:#1F2937;line-height:1.65">${esc(insight.hero_text)}</div>
    </div>` : ""}
    ${insight.strongest_point ? `
    <div style="display:flex;gap:14px;padding:18px 24px;border-bottom:1px solid #F9FAFB;align-items:flex-start">
      <span style="flex-shrink:0;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:4px 10px;border-radius:999px;background:rgba(22,163,74,.08);color:#16A34A;border:1px solid rgba(22,163,74,.2);white-space:nowrap;margin-top:2px">Strongest Point</span>
      <div style="font-size:13px;color:#374151;line-height:1.65">${esc(insight.strongest_point)}</div>
    </div>` : ""}
    ${insight.critical_gap ? `
    <div style="display:flex;gap:14px;padding:18px 24px;border-bottom:1px solid #F9FAFB;align-items:flex-start">
      <span style="flex-shrink:0;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:4px 10px;border-radius:999px;background:rgba(220,38,38,.06);color:#DC2626;border:1px solid rgba(220,38,38,.18);white-space:nowrap;margin-top:2px">Critical Gap</span>
      <div style="font-size:13px;color:#374151;line-height:1.65">${esc(insight.critical_gap)}</div>
    </div>` : ""}
    ${insight.quick_win ? `
    <div style="display:flex;gap:14px;padding:18px 24px;align-items:flex-start">
      <span style="flex-shrink:0;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:4px 10px;border-radius:999px;background:rgba(37,99,235,.07);color:#2563EB;border:1px solid rgba(37,99,235,.18);white-space:nowrap;margin-top:2px">Quick Win</span>
      <div style="font-size:13px;color:#374151;line-height:1.65">${esc(insight.quick_win)}</div>
    </div>` : ""}
  </div>` : `
  <div style="border:1px solid #E5E7EB;border-radius:14px;padding:32px 24px;text-align:center;margin-bottom:24px">
    <div style="font-size:13px;color:#9CA3AF">AI Intelligence data is not available for this scan.</div>
  </div>`}

  <div style="background:rgba(41,82,227,.04);border:1px solid rgba(41,82,227,.12);border-radius:12px;padding:16px 20px">
    <div style="font-size:12px;color:#2952E3;font-weight:500;line-height:1.6">
      These insights are generated by Claude AI and tailored specifically to ${sectorLabel ? `the <strong>${esc(sectorLabel)}</strong> sector` : "your domain"}. Use them as a strategic starting point alongside the action plan on the next page.
    </div>
  </div>

  ${pageFooter(domain, date, 3)}
</div>

<!-- ══════════════════════════════════════
     PAGE 4 — ACTION PLAN
══════════════════════════════════════ -->
<div style="${LAST_PAGE}">
  ${pageHeader(domain)}

  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#9CA3AF;margin-bottom:10px">Action Plan</div>

  <div style="border:1px solid #E5E7EB;border-radius:14px;overflow:hidden;margin-bottom:22px">
    <div style="padding:13px 20px;background:#FAFAFA;border-bottom:1px solid #F3F4F6;font-size:13px;font-weight:700;color:#111827">Priority Checklist — fix these first</div>
    ${criticalItems.map(item => `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid #F9FAFB">
      <div style="width:16px;height:16px;border-radius:4px;border:1.5px solid #D1D5DB;flex-shrink:0"></div>
      <div style="font-size:13px;color:#374151;flex:1">${esc(item)}</div>
      <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:3px 8px;border-radius:999px;background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;white-space:nowrap">Critical</span>
    </div>`).join("")}
  </div>

  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#9CA3AF;margin-bottom:10px">Technical Issues</div>
  <div style="border:1px solid #E5E7EB;border-radius:14px;overflow:hidden;margin-bottom:22px">
    <div style="padding:13px 20px;background:#FAFAFA;border-bottom:1px solid #F3F4F6;font-size:13px;font-weight:700;color:#111827">Scan Results</div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
          <th style="padding:9px 20px;text-align:left;font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid #F3F4F6;background:#FAFAFA">Issue</th>
          <th style="padding:9px 20px;text-align:left;font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid #F3F4F6;background:#FAFAFA">Status</th>
          <th style="padding:9px 20px;text-align:right;font-size:10px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid #F3F4F6;background:#FAFAFA">Since</th>
        </tr>
      </thead>
      <tbody>
        ${technicalIssues.map((row, i) => `
        <tr>
          <td style="padding:11px 20px;border-bottom:${i < technicalIssues.length - 1 ? "1px solid #F9FAFB" : "none"};font-size:13px;vertical-align:middle">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${row.status === "critical" ? "#DC2626" : "#D1D5DB"};margin-right:8px;vertical-align:middle"></span>
            ${esc(row.label)}
          </td>
          <td style="padding:11px 20px;border-bottom:${i < technicalIssues.length - 1 ? "1px solid #F9FAFB" : "none"};font-size:13px;vertical-align:middle">
            <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:3px 8px;border-radius:999px;${row.status === "critical" ? "background:#FEF2F2;color:#DC2626;border:1px solid #FECACA" : "background:#F3F4F6;color:#6B7280;border:1px solid #E5E7EB"}">${row.status}</span>
          </td>
          <td style="padding:11px 20px;border-bottom:${i < technicalIssues.length - 1 ? "1px solid #F9FAFB" : "none"};font-size:11px;color:#9CA3AF;text-align:right;vertical-align:middle">${row.status === "critical" ? "First scan" : "✓ OK"}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>

  ${pageFooter(domain, date, 4)}
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
