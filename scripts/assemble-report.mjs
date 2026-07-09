#!/usr/bin/env node
/**
 * Genessa Report Engine — Module 4.8: Report Assembly
 *
 * Orchestrates all modules in sequence for a single domain:
 *   1. Creates a `reports` row (status=generating)
 *   2. Runs 4.1 Technical SEO Scanner  → technical_scans
 *   3. Runs 4.3 Competitor Comparison  → report_sections.competitor_comparison
 *   4. Runs 4.4 Content Gap Analysis   → report_sections.content_gap
 *   5. Runs 4.6 Unified Score          → reports.ai_visibility_score + report_sections.ai_visibility
 *   6. Runs 4.7 Action Plan            → report_sections.action_plan
 *   7. Renders HTML report             → reports.report_html
 *   8. Sets status=completed
 *
 * Usage (standalone):
 *   node scripts/assemble-report.mjs --org-id=<uuid> --domain=nurdai.com [--days=30]
 *
 * Usage (as module):
 *   import { assembleReport } from "./scripts/assemble-report.mjs";
 *   const report = await assembleReport({ orgId, domain, days, supabase, anthropicKey });
 */

import { createClient }            from "@supabase/supabase-js";
import { scanDomain }              from "./tech-scanner.mjs";
import { buildCompetitorComparison } from "./competitor-aggregate.mjs";
import { buildContentGap }         from "./content-gap.mjs";
import { computeUnifiedScore }     from "./score-unified.mjs";
import { buildActionPlan }         from "./action-plan.mjs";

// ── Report HTML renderer ───────────────────────────────────────────────────────

function scoreBar(score, max = 100) {
  if (score == null) return `<span class="score-na">N/A</span>`;
  const pct   = Math.round((score / max) * 100);
  const color = score >= 70 ? "#22c55e" : score >= 50 ? "#eab308" : score >= 30 ? "#f97316" : "#ef4444";
  return `
    <div class="score-bar-wrap">
      <div class="score-bar-fill" style="width:${pct}%;background:${color}"></div>
      <span class="score-num">${score}</span>
    </div>`;
}

function statusIcon(status) {
  if (status === "pass")    return `<span class="icon-pass">✓</span>`;
  if (status === "partial") return `<span class="icon-partial">~</span>`;
  return `<span class="icon-fail">✗</span>`;
}

function renderTechnicalSection(scan) {
  if (!scan) return `<p class="no-data">Technical scan not available.</p>`;
  const rows = Object.entries(scan.checks ?? {})
    .map(([key, c]) => `
      <tr>
        <td>${statusIcon(c.status)}</td>
        <td class="check-key">${key.replace(/_/g, " ")}</td>
        <td class="check-detail">${c.detail ?? ""}</td>
        <td class="check-weight">${c.weight ?? 0}pts</td>
      </tr>`)
    .join("");

  const botRows = Object.entries(scan.ai_bot_permissions ?? {})
    .map(([bot, status]) => {
      const icon = status === "allowed" ? "✓" : status === "blocked" ? "✗" : "?";
      const cls  = status === "allowed" ? "allowed" : status === "blocked" ? "blocked" : "unknown";
      return `<li class="bot-${cls}">${icon} ${bot}</li>`;
    }).join("");

  return `
    <div class="metric-row">
      <span class="metric-label">Technical Score</span>
      ${scoreBar(scan.technical_score)}
    </div>
    <table class="checks-table">
      <tbody>${rows}</tbody>
    </table>
    <div class="bot-list-wrap">
      <h4>AI Bot Permissions</h4>
      <ul class="bot-list">${botRows}</ul>
    </div>`;
}

function renderCompetitorSection(data) {
  if (!data?.brands?.length) return `<p class="no-data">No competitor data available.</p>`;
  const totalMentions = data.brands.reduce((s, b) => s + (b.total_mentions ?? 0), 0);
  const rows = data.brands.slice(0, 10).map(b => {
    const sov = totalMentions > 0 ? ((b.total_mentions / totalMentions) * 100).toFixed(1) : "0";
    const bar = `<div class="sov-bar" style="width:${sov}%"></div>`;
    const tag = b.is_own_brand ? `<span class="own-brand-tag">YOUR BRAND</span>` : "";
    return `
      <tr class="${b.is_own_brand ? "own-brand-row" : ""}">
        <td>${b.name}${tag}</td>
        <td>${b.total_mentions}</td>
        <td>${b.avg_position ?? "—"}</td>
        <td><div class="sov-wrap">${bar}<span>${sov}%</span></div></td>
        <td>${Math.round((b.sentiment?.positive ?? 0) * 100)}%</td>
      </tr>`;
  }).join("");
  return `
    <p class="period-note">Last ${data.period_days} days · Engines: ${(data.engines ?? []).join(", ")}</p>
    <table class="competitor-table">
      <thead><tr><th>Brand</th><th>Mentions</th><th>Avg Position</th><th>Share of Voice</th><th>Positive Sentiment</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderContentGapSection(data) {
  if (!data?.gaps?.length) return `<p class="no-data">No content gaps identified.</p>`;
  const cards = data.gaps.map(g => `
    <div class="gap-card priority-${g.priority ?? "medium"}">
      <div class="gap-prompt">"${g.prompt}"</div>
      <div class="gap-meta">
        <span class="gap-type">${(g.gap_type ?? "").replace(/_/g, " ")}</span>
        <span class="gap-competitors">Competitors present: ${(g.competitors_present ?? []).slice(0, 4).join(", ")}</span>
      </div>
      <p class="gap-explanation">${g.gap_explanation ?? ""}</p>
      <div class="gap-rec"><strong>Recommendation:</strong> ${g.recommendation ?? ""}</div>
    </div>`).join("");
  return `<div class="gap-cards">${cards}</div>`;
}

function renderActionPlanSection(plan) {
  const actions = plan?.actions ?? [];
  if (!actions.length) return `<p class="no-data">Action plan not available.</p>`;

  const items = actions.map((a, i) => `
    <li class="action-item priority-${a.priority ?? "medium"}">
      <div class="action-header">
        <span class="action-num">${i + 1}</span>
        <span class="action-text">${a.action}</span>
      </div>
      <div class="action-meta">${a.owner ?? ""} · ${a.hours_estimate ?? ""}</div>
      <p class="action-rationale">${a.rationale ?? ""}</p>
      ${a.measurable_outcome ? `<div class="action-check"><strong>30 günde kontrol:</strong> ${a.measurable_outcome}</div>` : ""}
    </li>`).join("");

  const sc = plan.expected_score_change;
  const projection = sc
    ? `<div class="score-projection">30 gün sonra beklenen skor: <strong>${sc.from ?? "?"} → ${sc.to_low}–${sc.to_high}/100</strong></div>`
    : "";

  return `<ul class="action-list">${items}</ul>${projection}`;
}

function renderHTML({ domain, unifiedScore, grade, subScores, technicalScan, competitor, contentGap, actionPlan, generatedAt }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Genessa AI Visibility Report — ${domain}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0f;color:#e2e8f0;line-height:1.6}
    .page{max-width:900px;margin:0 auto;padding:40px 24px}
    /* Header */
    .report-header{text-align:center;padding:48px 0 40px;border-bottom:1px solid #1e293b}
    .brand-pill{display:inline-flex;align-items:center;gap:6px;background:#1e293b;border:1px solid #334155;border-radius:20px;padding:4px 14px;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#94a3b8;margin-bottom:16px}
    .brand-pill .dot{width:6px;height:6px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#06b6d4)}
    h1{font-size:28px;font-weight:700;color:#f1f5f9;margin-bottom:8px}
    .domain-tag{font-size:16px;color:#94a3b8}
    .generated-at{font-size:12px;color:#475569;margin-top:8px}
    /* Big score */
    .hero-score{text-align:center;padding:40px 0 32px}
    .score-circle{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:140px;height:140px;border-radius:50%;border:3px solid #1e293b;background:#0f172a;margin-bottom:12px}
    .score-circle .num{font-size:48px;font-weight:800;background:linear-gradient(135deg,#6366f1,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .score-circle .denom{font-size:14px;color:#475569}
    .grade-label{font-size:18px;font-weight:600;color:#94a3b8}
    /* Sections */
    .section{padding:36px 0;border-bottom:1px solid #1e293b}
    .section:last-child{border-bottom:none}
    .section-title{font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6366f1;margin-bottom:20px}
    h2{font-size:20px;font-weight:700;color:#f1f5f9;margin-bottom:6px}
    /* Sub-scores */
    .sub-scores{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
    .sub-card{background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:16px}
    .sub-card .label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:8px}
    .sub-card .value{font-size:28px;font-weight:800;color:#f1f5f9}
    .sub-card .weight{font-size:11px;color:#475569;margin-top:2px}
    /* Score bar */
    .score-bar-wrap{position:relative;height:8px;background:#1e293b;border-radius:4px;margin:8px 0;overflow:hidden}
    .score-bar-fill{position:absolute;top:0;left:0;height:100%;border-radius:4px;transition:width .3s}
    .score-num{font-size:12px;color:#94a3b8;display:block;text-align:right;margin-top:2px}
    .score-na{color:#475569;font-size:13px}
    .metric-row{display:flex;align-items:center;gap:16px;margin-bottom:12px}
    .metric-label{font-size:13px;font-weight:600;color:#94a3b8;min-width:140px}
    /* Checks table */
    .checks-table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
    .checks-table td{padding:8px 10px;border-bottom:1px solid #1e293b}
    .check-key{font-weight:600;color:#e2e8f0;white-space:nowrap}
    .check-detail{color:#94a3b8}
    .check-weight{color:#475569;text-align:right;white-space:nowrap}
    .icon-pass{color:#22c55e;font-weight:700}
    .icon-partial{color:#eab308;font-weight:700}
    .icon-fail{color:#ef4444;font-weight:700}
    /* Bot list */
    .bot-list-wrap{margin-top:20px}
    .bot-list-wrap h4{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:10px}
    .bot-list{list-style:none;display:flex;flex-wrap:wrap;gap:8px}
    .bot-list li{font-size:12px;font-weight:600;padding:4px 10px;border-radius:6px;border:1px solid}
    .bot-allowed{color:#22c55e;border-color:#166534;background:#052e16}
    .bot-blocked{color:#ef4444;border-color:#991b1b;background:#450a0a}
    .bot-unknown{color:#eab308;border-color:#854d0e;background:#1c1400}
    /* Competitor table */
    .period-note{font-size:12px;color:#475569;margin-bottom:12px}
    .competitor-table{width:100%;border-collapse:collapse;font-size:13px}
    .competitor-table th{text-align:left;padding:8px 10px;border-bottom:2px solid #1e293b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b}
    .competitor-table td{padding:8px 10px;border-bottom:1px solid #0f172a}
    .own-brand-row td{background:#0d1526}
    .own-brand-tag{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6366f1;background:#1e1b4b;border:1px solid #3730a3;border-radius:4px;padding:1px 6px;margin-left:8px}
    .sov-wrap{display:flex;align-items:center;gap:8px}
    .sov-bar{height:6px;border-radius:3px;background:linear-gradient(90deg,#6366f1,#06b6d4);min-width:2px}
    /* Gap cards */
    .gap-cards{display:flex;flex-direction:column;gap:16px;margin-top:8px}
    .gap-card{background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:16px 20px;border-left:3px solid}
    .gap-card.priority-high{border-left-color:#f97316}
    .gap-card.priority-critical{border-left-color:#ef4444}
    .gap-card.priority-medium{border-left-color:#eab308}
    .gap-card.priority-low{border-left-color:#22c55e}
    .gap-prompt{font-size:14px;font-weight:600;color:#f1f5f9;margin-bottom:8px}
    .gap-meta{display:flex;gap:12px;margin-bottom:8px}
    .gap-type{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;background:#1e293b;padding:2px 8px;border-radius:4px}
    .gap-competitors{font-size:12px;color:#64748b}
    .gap-explanation{font-size:13px;color:#94a3b8;margin-bottom:8px}
    .gap-rec{font-size:13px;color:#e2e8f0;background:#1e293b;border-radius:8px;padding:10px 12px;margin-top:8px}
    /* Action plan */
    .phase-block{background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:20px;margin-bottom:16px}
    .phase-header{display:flex;align-items:center;gap:12px;margin-bottom:8px}
    .phase-num{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6366f1;background:#1e1b4b;border:1px solid #3730a3;border-radius:4px;padding:2px 8px}
    .phase-title{font-size:16px;font-weight:700;color:#f1f5f9}
    .phase-focus{font-size:13px;color:#94a3b8;margin-bottom:6px}
    .phase-impact{font-size:13px;color:#e2e8f0;margin-bottom:16px}
    .action-list{list-style:none;display:flex;flex-direction:column;gap:12px}
    .action-item{background:#0a0a0f;border:1px solid #1e293b;border-radius:8px;padding:12px;border-left:3px solid}
    .action-item.priority-critical{border-left-color:#ef4444}
    .action-item.priority-high{border-left-color:#f97316}
    .action-item.priority-medium{border-left-color:#eab308}
    .action-text{display:block;font-size:14px;font-weight:600;color:#f1f5f9;margin-bottom:4px}
    .action-meta{display:block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:6px}
    .action-rationale{font-size:12px;color:#64748b;margin:0}
    .score-projection{margin-top:20px;text-align:center;font-size:15px;color:#94a3b8;background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:16px}
    .action-header{display:flex;align-items:flex-start;gap:10px;margin-bottom:4px}
    .action-num{flex-shrink:0;width:22px;height:22px;border-radius:50%;background:#1e293b;font-size:11px;font-weight:700;color:#94a3b8;display:flex;align-items:center;justify-content:center;margin-top:2px}
    .action-check{font-size:12px;color:#22c55e;background:#052e16;border:1px solid #166534;border-radius:6px;padding:6px 10px;margin-top:8px}
    .no-data{color:#475569;font-style:italic;font-size:13px}
    /* Footer */
    .report-footer{text-align:center;padding:40px 0 24px;border-top:1px solid #1e293b;margin-top:16px}
    .footer-brand{font-size:13px;font-weight:700;color:#6366f1;margin-bottom:4px}
    .footer-note{font-size:12px;color:#475569}
    @media(max-width:600px){
      .sub-scores{grid-template-columns:1fr}
      .competitor-table{font-size:11px}
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="report-header">
    <div class="brand-pill"><span class="dot"></span>Genessa by NurdAI · AI Visibility Report</div>
    <h1>AI Visibility Audit</h1>
    <div class="domain-tag">${domain}</div>
    <div class="generated-at">Generated ${generatedAt}</div>
  </div>

  <!-- Hero Score -->
  <div class="hero-score">
    <div class="score-circle">
      <span class="num">${unifiedScore ?? "—"}</span>
      <span class="denom">/100</span>
    </div>
    <div class="grade-label">AI Visibility Score: ${grade}</div>
    <div class="sub-scores">
      <div class="sub-card">
        <div class="label">Technical</div>
        <div class="value">${subScores?.technical?.score ?? "—"}</div>
        <div class="weight">30% weight</div>
      </div>
      <div class="sub-card">
        <div class="label">Citation Rate</div>
        <div class="value">${subScores?.citation?.score != null ? subScores.citation.score + "%" : "—"}</div>
        <div class="weight">40% weight</div>
      </div>
      <div class="sub-card">
        <div class="label">Sentiment</div>
        <div class="value">${subScores?.sentiment?.score != null ? subScores.sentiment.score + "%" : "—"}</div>
        <div class="weight">30% weight</div>
      </div>
    </div>
  </div>

  <!-- Section 1: Technical SEO -->
  <div class="section">
    <div class="section-title">Section 1</div>
    <h2>Technical SEO & AI Crawlability</h2>
    ${renderTechnicalSection(technicalScan)}
  </div>

  <!-- Section 2: Competitor Comparison -->
  <div class="section">
    <div class="section-title">Section 2</div>
    <h2>Competitor Share of Voice</h2>
    ${renderCompetitorSection(competitor)}
  </div>

  <!-- Section 3: Content Gaps -->
  <div class="section">
    <div class="section-title">Section 3</div>
    <h2>Content Gap Analysis</h2>
    ${renderContentGapSection(contentGap)}
  </div>

  <!-- Section 4: Action Plan -->
  <div class="section">
    <div class="section-title">Section 4</div>
    <h2>Bu Ay İçin Aksiyon Planı</h2>
    ${actionPlan?.summary ? `<p style="color:#94a3b8;margin-bottom:20px">${actionPlan.summary}</p>` : ""}
    ${renderActionPlanSection(actionPlan)}
  </div>

  <!-- Footer -->
  <div class="report-footer">
    <div class="footer-brand">Genessa by NurdAI</div>
    <div class="footer-note">AI Visibility Report · ${domain} · ${generatedAt}</div>
    <div class="footer-note" style="margin-top:6px">Contact: <a href="https://wa.me/905325788737" style="color:#6366f1">WhatsApp</a></div>
  </div>

</div>
</body>
</html>`;
}

// ── Main orchestrator ──────────────────────────────────────────────────────────

export async function assembleReport({ orgId, domain, days = 30, supabase, anthropicKey }) {
  const generatedAt = new Date().toUTCString();

  // 1. Create report row
  const { data: report, error: createErr } = await supabase
    .from("reports")
    .insert({
      organization_id: orgId,
      domain,
      status: "generating",
    })
    .select()
    .single();

  if (createErr) throw new Error(`reports insert: ${createErr.message}`);
  const reportId = report.id;
  console.log(`[assemble-report] Created report ${reportId} for ${domain}`);

  async function fail(msg) {
    await supabase.from("reports").update({ status: "failed", error_message: msg }).eq("id", reportId);
    throw new Error(msg);
  }

  try {
    // 2. Technical SEO scan
    console.log("[assemble-report] 4.1 Technical scan…");
    const technicalScan = await scanDomain(domain, { orgId, reportId, supabase });

    // 3. Competitor comparison
    console.log("[assemble-report] 4.3 Competitor comparison…");
    const competitor = await buildCompetitorComparison({ orgId, reportId, days, supabase });

    // 4. Content gap
    console.log("[assemble-report] 4.4 Content gap…");
    const contentGap = await buildContentGap({ orgId, reportId, days, supabase, anthropicKey });

    // 5. Unified score
    console.log("[assemble-report] 4.6 Unified score…");
    const scoreData = await computeUnifiedScore({ orgId, reportId, days, supabase });

    // 6. Action plan
    console.log("[assemble-report] 4.7 Action plan…");
    const actionPlan = await buildActionPlan({ orgId, reportId, days, supabase, anthropicKey });

    // 7. Render HTML
    console.log("[assemble-report] 4.8 Rendering HTML…");
    const html = renderHTML({
      domain,
      unifiedScore:  scoreData.unified_score,
      grade:         scoreData.grade,
      subScores:     scoreData.sub_scores,
      technicalScan,
      competitor,
      contentGap,
      actionPlan,
      generatedAt,
    });

    // 8. Save HTML + mark completed
    const { error: updateErr } = await supabase
      .from("reports")
      .update({
        status:              "completed",
        report_html:         html,
        ai_visibility_score: scoreData.unified_score,
        completed_at:        new Date().toISOString(),
      })
      .eq("id", reportId);

    if (updateErr) throw new Error(`reports update: ${updateErr.message}`);

    console.log(`[assemble-report] Done. Report ${reportId} completed.`);
    return { reportId, html, score: scoreData };

  } catch (err) {
    await fail(err.message);
  }
}

// ── CLI ────────────────────────────────────────────────────────────────────────

import { writeFile } from "node:fs/promises";
import { resolve }   from "node:path";

function parseCLIArgs(argv) {
  const flags = Object.fromEntries(
    argv.filter(a => a.startsWith("--")).map(a => {
      const [k, ...v] = a.slice(2).split("=");
      return [k, v.join("=") || true];
    })
  );
  return {
    orgId:  flags["org-id"],
    domain: flags["domain"],
    days:   flags["days"] ? parseInt(flags["days"], 10) : 30,
    out:    flags["out"] ?? null,
  };
}

if (process.argv[1] && new URL(process.argv[1], import.meta.url).pathname === new URL(import.meta.url).pathname) {
  const { orgId, domain, days, out } = parseCLIArgs(process.argv.slice(2));

  if (!orgId || !domain) {
    console.error("Usage: node scripts/assemble-report.mjs --org-id=<uuid> --domain=<domain> [--days=30] [--out=report.html]");
    process.exit(1);
  }

  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!supabaseUrl || !supabaseKey || !anthropicKey) {
    console.error("[assemble-report] Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { reportId, html, score } = await assembleReport({ orgId, domain, days, supabase, anthropicKey });

  console.log(`\n── Report assembled ─────────────────────────────────────────`);
  console.log(`Report ID:  ${reportId}`);
  console.log(`Score:      ${score.unified_score ?? "N/A"}/100 (${score.grade})`);

  const outPath = out ?? `report-${domain.replace(/[^a-z0-9]/gi, "_")}.html`;
  await writeFile(resolve(outPath), html, "utf-8");
  console.log(`HTML saved: ${resolve(outPath)}`);
}
