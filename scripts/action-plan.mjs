#!/usr/bin/env node
/**
 * Genessa Report Engine — Module 4.7: Action Plan Generator
 *
 * Produces a flat, priority-ordered list of 5-8 actions that can each
 * be STARTED and COMPLETED within 30 days, with measurable outcomes
 * visible within that same window. No phases, no long-term campaigns.
 *
 * If a previous completed report exists for the same org, its action plan
 * is loaded as context so Claude avoids repeating resolved items.
 *
 * Usage (standalone):
 *   node scripts/action-plan.mjs --org-id=<uuid> [--report-id=<uuid>] [--days=30]
 *
 * Usage (as module):
 *   import { buildActionPlan } from "./scripts/action-plan.mjs";
 *   const plan = await buildActionPlan({ orgId, reportId, days, supabase, anthropicKey });
 */

import { createClient } from "@supabase/supabase-js";

const CLAUDE_MODEL  = "claude-haiku-4-5-20251001";
const FETCH_TIMEOUT = 45_000;

// ── Fetch helper ───────────────────────────────────────────────────────────────

async function fetchWithTimeout(url, opts, ms = FETCH_TIMEOUT) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } catch (err) {
    if (err.name === "AbortError") throw new Error(`Timeout: ${url}`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function callClaude(system, user, apiKey) {
  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method:  "POST",
    headers: {
      "x-api-key":         apiKey,
      "anthropic-version": "2023-06-01",
      "content-type":      "application/json",
    },
    body: JSON.stringify({
      model:      CLAUDE_MODEL,
      max_tokens: 2500,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.content?.[0]?.text ?? "";
}

// ── Previous report loader ─────────────────────────────────────────────────────

async function loadPreviousActionPlan(supabase, orgId, currentReportId) {
  // Find the most recently completed report for this org, excluding the current one
  const query = supabase
    .from("reports")
    .select("id")
    .eq("organization_id", orgId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1);

  if (currentReportId) query.neq("id", currentReportId);

  const { data: reports } = await query;
  const prevReportId = reports?.[0]?.id;
  if (!prevReportId) return null;

  const { data: sections } = await supabase
    .from("report_sections")
    .select("content_json")
    .eq("report_id", prevReportId)
    .eq("section_key", "action_plan")
    .single();

  return sections?.content_json ?? null;
}

// ── Current context loader ─────────────────────────────────────────────────────

async function loadContext(supabase, orgId, reportId, days) {
  const ctx = {};

  const { data: scans } = await supabase
    .from("technical_scans")
    .select("technical_score, checks, ai_bot_permissions, llms_txt_accessible, has_json_ld, schema_types, robots_accessible, sitemap_accessible")
    .eq("organization_id", orgId)
    .order("scanned_at", { ascending: false })
    .limit(1);
  ctx.technicalScan = scans?.[0] ?? null;

  if (reportId) {
    const { data: sections } = await supabase
      .from("report_sections")
      .select("section_key, content_json")
      .eq("report_id", reportId)
      .in("section_key", ["content_gap", "competitor_comparison", "ai_visibility"]);

    for (const s of sections ?? []) ctx[s.section_key] = s.content_json;
  }

  if (!ctx.competitor_comparison) {
    const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
    const { data: prompts } = await supabase
      .from("engine_prompts")
      .select("id")
      .eq("organization_id", orgId);
    const promptIds = prompts?.map(p => p.id) ?? [];
    if (promptIds.length > 0) {
      const { data: runs } = await supabase
        .from("engine_runs")
        .select("id, engine")
        .in("prompt_id", promptIds)
        .gte("run_timestamp", cutoff)
        .eq("status", "completed");
      const runIds = runs?.map(r => r.id) ?? [];
      if (runIds.length > 0) {
        const { data: mentions } = await supabase
          .from("brand_mentions")
          .select("brand_name, is_own_brand, sentiment")
          .in("run_id", runIds);
        const ownBrand  = mentions?.find(m => m.is_own_brand)?.brand_name ?? null;
        const ownCount  = (mentions ?? []).filter(m => m.is_own_brand).length;
        const total     = (mentions ?? []).length;
        ctx.competitor_comparison = {
          own_brand: ownBrand,
          own_mentions: ownCount,
          total_mentions: total,
          sov: total > 0 ? Math.round((ownCount / total) * 1000) / 10 : 0,
        };
      }
    }
  }

  return ctx;
}

// ── Prompt builder ─────────────────────────────────────────────────────────────

const SYSTEM = `You are a senior AI visibility strategist. Your task is to write a short,
high-impact action plan for a client's CURRENT MONTH only.

STRICT RULES — violating any of these makes the output useless:
1. Every action MUST be startable and fully completable within 30 days.
2. Every action's result MUST be measurable within 30 days (e.g. a page goes live,
   a score increases, a crawl test passes — not "brand awareness grows over time").
3. NEVER include: multi-month campaigns, authority-building series, quarterly monitoring
   setups, ongoing writer/expert collaborations, PR outreach campaigns, link acquisition
   campaigns, or any item that takes more than 30 days to show results.
4. If an action cannot be finished and verified within this month, DO NOT include it.
5. Produce 5–8 actions total, priority-ordered (most impactful first). No phases, no weeks.
6. Be concrete: name the exact file, page, schema type, or tool. No vague directives.

Respond ONLY with valid JSON — no markdown, no prose outside the JSON.`;

function buildPrompt(ctx, previousPlan) {
  const { technicalScan, content_gap, competitor_comparison, ai_visibility } = ctx;

  const failedChecks = Object.entries(technicalScan?.checks ?? {})
    .filter(([, v]) => v.status === "fail")
    .map(([k, v]) => `${k}: ${v.detail?.slice(0, 100)}`);

  const partialChecks = Object.entries(technicalScan?.checks ?? {})
    .filter(([, v]) => v.status === "partial")
    .map(([k, v]) => `${k}: ${v.detail?.slice(0, 100)}`);

  const techSummary = technicalScan
    ? `Technical score: ${technicalScan.technical_score}/100.
llms.txt: ${technicalScan.llms_txt_accessible ? "present" : "MISSING"}.
JSON-LD: ${technicalScan.has_json_ld ? "present" : "MISSING"} (types: ${technicalScan.schema_types?.join(", ") || "none"}).
robots.txt: ${technicalScan.robots_accessible ? "present" : "MISSING"}.
sitemap: ${technicalScan.sitemap_accessible ? "present" : "MISSING"}.
AI bot permissions: ${JSON.stringify(technicalScan.ai_bot_permissions ?? {})}.
FAILED checks (fix these): ${failedChecks.join("; ") || "none"}.
PARTIAL checks (improve these): ${partialChecks.join("; ") || "none"}.`
    : "Technical scan not yet run.";

  const visSummary = `Own brand: ${competitor_comparison?.own_brand ?? "unknown"}.
Unified score: ${ai_visibility?.unified_score ?? "N/A"}/100 (${ai_visibility?.grade ?? "N/A"}).
Citation rate: ${ai_visibility?.sub_scores?.citation?.score ?? "N/A"}%.
Sentiment score: ${ai_visibility?.sub_scores?.sentiment?.score ?? "N/A"}%.
Share of Voice: ${competitor_comparison?.sov ?? "N/A"}% of all brand mentions.`;

  const gapSummary = content_gap?.gaps?.length
    ? content_gap.gaps.slice(0, 5).map(g =>
        `- "${g.prompt}" → type: ${g.gap_type}, competitors: ${(g.competitors_present ?? []).join(", ")}`
      ).join("\n")
    : "No content gaps analysed.";

  const prevSection = previousPlan?.actions?.length
    ? `\n---\nPREVIOUS MONTH'S ACTION PLAN (for continuity):
${previousPlan.actions.map((a, i) => `${i + 1}. [${a.priority}] ${a.action}`).join("\n")}

Instructions regarding previous plan:
- If current data (technical scan, citation rate, content gaps) shows a previous item is STILL
  an open problem, you may include it again — but only if it truly wasn't done.
- If current data suggests a previous item was resolved (e.g. llms.txt now present, score improved),
  DO NOT list it again. You may briefly note "llms.txt oluşturuldu — etki izleniyor" in the summary.
- Prioritise findings that are NEW this month over repeated items.
---\n`
    : "";

  return `${prevSection}Current data:

TECHNICAL SEO:
${techSummary}

AI VISIBILITY:
${visSummary}

CONTENT GAPS (queries where own brand is absent):
${gapSummary}

Generate the action plan for THIS MONTH ONLY. Return JSON:
{
  "summary": "<2-3 sentences: what are the most critical open issues this month and what changed vs last month if applicable>",
  "actions": [
    {
      "action": "<exact deliverable: file name, page URL, schema type, tool — be specific>",
      "rationale": "<one sentence: why this improves AI visibility within 30 days>",
      "measurable_outcome": "<what you can check in 30 days to confirm it worked>",
      "owner": "<dev | content | seo | management>",
      "hours_estimate": "<e.g. 2h>",
      "priority": "critical | high | medium"
    }
  ],
  "expected_score_change": {
    "from": <current unified score as number or null>,
    "to_low": <realistic low estimate after 30 days>,
    "to_high": <realistic high estimate after 30 days>
  }
}

5–8 actions only. No phases. No items that take longer than 30 days.`;
}

// ── Main export ────────────────────────────────────────────────────────────────

export async function buildActionPlan({ orgId, reportId, days = 30, supabase, anthropicKey }) {
  console.log("[action-plan] Loading context…");
  const [ctx, previousPlan] = await Promise.all([
    loadContext(supabase, orgId, reportId, days),
    loadPreviousActionPlan(supabase, orgId, reportId),
  ]);

  if (previousPlan) {
    console.log("[action-plan] Previous action plan found — adding as context.");
  }

  const prompt = buildPrompt(ctx, previousPlan);
  console.log("[action-plan] Calling Claude…");
  const raw = await callClaude(SYSTEM, prompt, anthropicKey);

  let plan;
  try {
    const cleaned = raw.replace(/```(?:json)?/g, "").trim();
    plan = JSON.parse(cleaned);
  } catch {
    console.error("[action-plan] JSON parse failed:", raw.slice(0, 300));
    plan = { summary: raw.slice(0, 500), actions: [] };
  }

  if (reportId) {
    const { error } = await supabase
      .from("report_sections")
      .upsert(
        { report_id: reportId, section_key: "action_plan", content_json: plan },
        { onConflict: "report_id,section_key" }
      );
    if (error) console.error("[action-plan] Upsert error:", error.message);
    else console.log("[action-plan] Saved → report_sections (action_plan)");
  }

  return plan;
}

// ── CLI ────────────────────────────────────────────────────────────────────────

function parseCLIArgs(argv) {
  const flags = Object.fromEntries(
    argv.filter(a => a.startsWith("--")).map(a => {
      const [k, ...v] = a.slice(2).split("=");
      return [k, v.join("=") || true];
    })
  );
  return {
    orgId:    flags["org-id"],
    reportId: flags["report-id"],
    days:     flags["days"] ? parseInt(flags["days"], 10) : 30,
  };
}

if (process.argv[1] && new URL(process.argv[1], import.meta.url).pathname === new URL(import.meta.url).pathname) {
  const { orgId, reportId, days } = parseCLIArgs(process.argv.slice(2));

  if (!orgId) {
    console.error("Usage: node scripts/action-plan.mjs --org-id=<uuid> [--report-id=<uuid>] [--days=30]");
    process.exit(1);
  }

  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!supabaseUrl || !supabaseKey || !anthropicKey) {
    console.error("[action-plan] Missing: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const plan = await buildActionPlan({ orgId, reportId, days, supabase, anthropicKey });

  console.log(`\n── Bu Ay İçin Aksiyon Planı ──────────────────────────────────`);
  console.log(`Summary: ${plan.summary}`);
  console.log(`\nActions (${plan.actions?.length ?? 0}):`);
  for (const [i, a] of (plan.actions ?? []).entries()) {
    const icon = a.priority === "critical" ? "🔴" : a.priority === "high" ? "🟠" : "🟡";
    console.log(`\n  ${i + 1}. ${icon} [${a.owner} / ${a.hours_estimate}] ${a.action}`);
    console.log(`     Why:    ${a.rationale}`);
    console.log(`     Check:  ${a.measurable_outcome}`);
  }
  if (plan.expected_score_change) {
    const s = plan.expected_score_change;
    console.log(`\nScore: ${s.from ?? "?"} → ${s.to_low}–${s.to_high}/100 (30 gün içinde)`);
  }
}
