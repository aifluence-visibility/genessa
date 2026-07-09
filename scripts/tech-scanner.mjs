#!/usr/bin/env node
/**
 * Genessa Report Engine — Module 4.1: Technical SEO Scanner
 *
 * Fetches a domain and checks all signals that affect AI visibility:
 * HTTPS, title/meta, Schema.org/JSON-LD, robots.txt (AI bot permissions),
 * sitemap, llms.txt, Open Graph, entity links, SSR detection.
 *
 * Saves results to technical_scans table and returns the row.
 *
 * Usage (standalone):
 *   node scripts/tech-scanner.mjs nurdai.com [--org-id=<uuid>] [--report-id=<uuid>]
 *
 * Usage (as module):
 *   import { scanDomain } from "./scripts/tech-scanner.mjs";
 *   const result = await scanDomain("nurdai.com", { orgId, reportId, supabase });
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL   — required
 *   SUPABASE_SERVICE_ROLE_KEY  — required
 */

import { createClient } from "@supabase/supabase-js";

// ── Constants ──────────────────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 12_000;
const MAX_BODY_BYTES   = 512_000; // 512 KB cap on HTML read
const MAX_ROBOTS_BYTES = 64_000;

const AI_BOTS = [
  "GPTBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "OAI-SearchBot",
];

// Check weights — must sum to 100
const CHECK_WEIGHTS = {
  https:          5,
  title:          5,
  meta_description: 5,
  og_tags:        5,
  schema_org:     15,
  robots_ai_bots: 20,
  sitemap:        10,
  llms_txt:       20,
  entity_links:   10,
  ssr:            5,
};

// ── Fetch helper ───────────────────────────────────────────────────────────────

async function fetchWithTimeout(url, opts = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal, redirect: "follow" });
  } catch (err) {
    if (err.name === "AbortError") throw new Error(`Timeout fetching ${url}`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Read response body up to MAX_BODY_BYTES, return as text. */
async function readBodyCapped(res, maxBytes = MAX_BODY_BYTES) {
  const reader = res.body?.getReader();
  if (!reader) return await res.text();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
    if (total >= maxBytes) { reader.cancel(); break; }
  }
  return new TextDecoder().decode(Buffer.concat(chunks.map(c => Buffer.from(c))));
}

// ── Normalise domain ───────────────────────────────────────────────────────────

function normaliseDomain(raw) {
  let d = raw.trim().toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
  return d;
}

function baseUrl(domain) {
  return `https://${domain}`;
}

// ── HTML extractors ────────────────────────────────────────────────────────────

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, " ").trim() : null;
}

function extractMetaDescription(html) {
  // handles both attribute orders
  const p1 = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{0,500})["']/i);
  const p2 = html.match(/<meta[^>]+content=["']([^"']{0,500})["'][^>]+name=["']description["']/i);
  const raw = (p1 || p2)?.[1] ?? null;
  return raw?.replace(/\s+/g, " ").trim() ?? null;
}

function extractOgTags(html) {
  const tags = {};
  const re = /<meta[^>]+property=["']og:([^"']+)["'][^>]+content=["']([^"']{0,500})["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) tags[m[1]] = m[2];
  // also try reversed attribute order
  const re2 = /<meta[^>]+content=["']([^"']{0,500})["'][^>]+property=["']og:([^"']+)["']/gi;
  while ((m = re2.exec(html)) !== null) if (!tags[m[2]]) tags[m[2]] = m[1];
  return tags;
}

function extractTwitterCard(html) {
  const p1 = html.match(/<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']+)["']/i);
  const p2 = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:card["']/i);
  return (p1 || p2)?.[1] ?? null;
}

function extractJsonLd(html) {
  const blocks = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim());
      blocks.push(parsed);
      if (blocks.length >= 5) break;
    } catch { /* skip malformed */ }
  }
  return blocks;
}

function extractSchemaTypes(blocks) {
  const types = new Set();
  function walk(obj) {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) { obj.forEach(walk); return; }
    if (obj["@type"]) {
      const t = obj["@type"];
      if (Array.isArray(t)) t.forEach(x => types.add(x));
      else types.add(String(t));
    }
    // recurse into @graph
    if (obj["@graph"]) walk(obj["@graph"]);
  }
  blocks.forEach(walk);
  return [...types];
}

function hasEntityLinks(html) {
  const wikidata  = /https?:\/\/www\.wikidata\.org/i.test(html);
  const wikipedia = /https?:\/\/[a-z]{2}\.wikipedia\.org/i.test(html);
  return { wikidata, wikipedia };
}

function detectSSR(html) {
  // Heuristic: JS-heavy single-page apps have very little text in initial HTML.
  // Strip tags and check if there's > 200 chars of visible text.
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.length > 200;
}

// ── Robots.txt parser ──────────────────────────────────────────────────────────

/**
 * Parses robots.txt and returns per-bot status for each AI_BOTS entry.
 * Status: 'allowed' | 'blocked' | 'unknown'
 *
 * Logic:
 * 1. Build a map: agent → { disallowRoots, allowRoots }
 * 2. For each AI bot, check specific block first, then wildcard.
 * 3. A bot is "blocked" if Disallow: / covers / with no Allow: / override.
 * 4. A bot is "unknown" if not mentioned and wildcard has no Disallow: /.
 */
function parseRobotsTxt(content) {
  const permissions = {};
  for (const bot of AI_BOTS) permissions[bot] = "unknown";

  if (!content?.trim()) return permissions;

  // Split into blocks by User-agent groups
  const lines = content.split(/\r?\n/);
  const blocks = []; // [{ agents: [], disallows: [], allows: [] }]
  let current = null;

  for (const rawLine of lines) {
    const line = rawLine.split("#")[0].trim();
    if (!line) {
      if (current) { blocks.push(current); current = null; }
      continue;
    }
    const [key, ...rest] = line.split(":").map(s => s.trim());
    const val = rest.join(":").trim();

    if (key.toLowerCase() === "user-agent") {
      if (!current) current = { agents: [], disallows: [], allows: [] };
      current.agents.push(val);
    } else if (key.toLowerCase() === "disallow" && current) {
      current.disallows.push(val);
    } else if (key.toLowerCase() === "allow" && current) {
      current.allows.push(val);
    }
  }
  if (current) blocks.push(current);

  // Helper: does this block block root /?
  function blockBlocks(block) {
    const disallowsRoot = block.disallows.some(d => d === "/" || d === "");
    if (!disallowsRoot) return false;
    // Check if Allow: / overrides it
    const allowsRoot = block.allows.some(a => a === "/");
    return !allowsRoot;
  }

  function blockAllows(block) {
    const disallowsRoot = block.disallows.some(d => d === "/" || d === "");
    return !disallowsRoot;
  }

  // Find wildcard block
  const wildcardBlock = blocks.find(b =>
    b.agents.some(a => a === "*")
  );

  for (const bot of AI_BOTS) {
    // Find specific block for this bot (case-insensitive)
    const specificBlock = blocks.find(b =>
      b.agents.some(a => a.toLowerCase() === bot.toLowerCase())
    );

    if (specificBlock) {
      permissions[bot] = blockBlocks(specificBlock) ? "blocked" : "allowed";
    } else if (wildcardBlock) {
      permissions[bot] = blockBlocks(wildcardBlock) ? "blocked" : "allowed";
    } else {
      permissions[bot] = "unknown"; // no rules found → assume allowed
    }
  }

  return permissions;
}

// ── Check evaluator ────────────────────────────────────────────────────────────

function evaluateChecks(data) {
  const checks = {};

  // https
  checks.https = data.is_https
    ? { status: "pass",    detail: "Site is served over HTTPS." }
    : { status: "fail",    detail: "Site is not served over HTTPS. AI crawlers deprioritise insecure sites." };

  // title
  if (!data.title) {
    checks.title = { status: "fail", detail: "No <title> tag found." };
  } else if (data.title.length < 20 || data.title.length > 70) {
    checks.title = { status: "partial", detail: `Title found (${data.title.length} chars) but ideal length is 20-70 chars: "${data.title.slice(0, 80)}"` };
  } else {
    checks.title = { status: "pass", detail: `Title present and well-formed: "${data.title.slice(0, 80)}"` };
  }

  // meta_description
  if (!data.meta_description) {
    checks.meta_description = { status: "fail", detail: "No meta description found. AI systems use this for context." };
  } else if (data.meta_description.length < 50 || data.meta_description.length > 160) {
    checks.meta_description = { status: "partial", detail: `Meta description found (${data.meta_description.length} chars), ideal 50-160 chars.` };
  } else {
    checks.meta_description = { status: "pass", detail: `Meta description present (${data.meta_description.length} chars).` };
  }

  // og_tags
  const ogKeys = Object.keys(data.og_tags ?? {});
  if (ogKeys.length === 0) {
    checks.og_tags = { status: "fail", detail: "No Open Graph tags found. Required for social/AI sharing context." };
  } else if (!data.og_tags.title || !data.og_tags.description) {
    checks.og_tags = { status: "partial", detail: `OG tags present (${ogKeys.join(", ")}) but og:title or og:description missing.` };
  } else {
    checks.og_tags = { status: "pass", detail: `OG tags present: ${ogKeys.join(", ")}.` };
  }

  // schema_org
  if (!data.has_json_ld || !data.schema_types?.length) {
    checks.schema_org = { status: "fail", detail: "No JSON-LD / Schema.org markup found. This is the single most impactful technical fix for AI visibility." };
  } else {
    const types = data.schema_types;
    const aiHighValue = ["Organization", "WebSite", "Product", "Service", "Person", "Article", "FAQPage", "HowTo", "LocalBusiness"];
    const hasHighValue = types.some(t => aiHighValue.includes(t));
    if (hasHighValue) {
      checks.schema_org = { status: "pass", detail: `JSON-LD present with AI-relevant types: ${types.join(", ")}.` };
    } else {
      checks.schema_org = { status: "partial", detail: `JSON-LD present (types: ${types.join(", ")}) but no high-value AI types (Organization, Product, FAQPage, etc.).` };
    }
  }

  // robots_ai_bots
  const perms = data.ai_bot_permissions ?? {};
  if (!data.robots_accessible) {
    checks.robots_ai_bots = { status: "fail", detail: "robots.txt not accessible. AI bots cannot read crawl permissions." };
  } else {
    const blocked = AI_BOTS.filter(b => perms[b] === "blocked");
    const unknown = AI_BOTS.filter(b => perms[b] === "unknown");
    if (blocked.length === 0 && unknown.length === 0) {
      checks.robots_ai_bots = { status: "pass", detail: `All AI bots explicitly allowed: ${AI_BOTS.join(", ")}.` };
    } else if (blocked.length > 0) {
      checks.robots_ai_bots = { status: "fail", detail: `AI bots blocked: ${blocked.join(", ")}. This prevents indexing by those AI systems.` };
    } else {
      // some unknown — not explicitly mentioned
      checks.robots_ai_bots = { status: "partial", detail: `Some AI bots not explicitly listed in robots.txt (unknown: ${unknown.join(", ")}). Best practice is to explicitly allow each.` };
    }
  }

  // sitemap
  if (!data.sitemap_accessible) {
    checks.sitemap = { status: "fail", detail: "No sitemap.xml found. AI crawlers use sitemaps to discover all pages." };
  } else {
    checks.sitemap = { status: "pass", detail: `Sitemap accessible at ${data.sitemap_url}.` };
  }

  // llms_txt
  if (!data.llms_txt_accessible) {
    checks.llms_txt = { status: "fail", detail: "No llms.txt found. This file tells AI systems what your business does and how to represent you accurately." };
  } else {
    const len = data.llms_txt_content?.length ?? 0;
    if (len < 100) {
      checks.llms_txt = { status: "partial", detail: `llms.txt found but very short (${len} chars). Expand with business description, key services, and brand guidelines.` };
    } else {
      checks.llms_txt = { status: "pass", detail: `llms.txt found and has content (${len} chars).` };
    }
  }

  // entity_links
  if (data.has_wikidata_link && data.has_wikipedia_link) {
    checks.entity_links = { status: "pass", detail: "Wikidata and Wikipedia entity links found — strong authority signal for AI systems." };
  } else if (data.has_wikidata_link || data.has_wikipedia_link) {
    const found = data.has_wikidata_link ? "Wikidata" : "Wikipedia";
    const missing = data.has_wikidata_link ? "Wikipedia" : "Wikidata";
    checks.entity_links = { status: "partial", detail: `${found} link found but ${missing} link missing.` };
  } else {
    checks.entity_links = { status: "fail", detail: "No Wikidata or Wikipedia entity links found. These are key authority signals for AI citations." };
  }

  // ssr
  if (!data.is_server_side_rendered) {
    checks.ssr = { status: "fail", detail: "Page appears to be client-side rendered (JS-heavy). AI crawlers may not execute JavaScript and will see an empty page." };
  } else {
    checks.ssr = { status: "pass", detail: "Page content is server-side rendered — accessible to AI crawlers without JavaScript execution." };
  }

  // Add weights
  for (const [key, weight] of Object.entries(CHECK_WEIGHTS)) {
    if (checks[key]) checks[key].weight = weight;
  }

  return checks;
}

// ── Technical score ────────────────────────────────────────────────────────────

function computeTechnicalScore(checks) {
  let earned = 0;
  let total  = 0;
  for (const [key, weight] of Object.entries(CHECK_WEIGHTS)) {
    total += weight;
    const c = checks[key];
    if (!c) continue;
    if (c.status === "pass")    earned += weight;
    if (c.status === "partial") earned += weight * 0.5;
    // fail = 0
  }
  return total > 0 ? Math.round((earned / total) * 100) : 0;
}

// ── Main scan function ─────────────────────────────────────────────────────────

/**
 * @param {string} rawDomain  — e.g. "nurdai.com" or "https://nurdai.com"
 * @param {{ orgId?: string, reportId?: string, supabase?: object }} opts
 * @returns {Promise<object>}  — the technical_scans row
 */
export async function scanDomain(rawDomain, opts = {}) {
  const domain = normaliseDomain(rawDomain);
  const origin = baseUrl(domain);

  const row = {
    organization_id: opts.orgId ?? null,
    report_id:       opts.reportId ?? null,
    domain,
    og_tags:         {},
  };

  // ── 1. Fetch homepage ────────────────────────────────────────────────────────
  const t0 = Date.now();
  let html = "";
  try {
    const res = await fetchWithTimeout(origin, {
      headers: {
        "User-Agent": "Genessa-Scanner/1.0 (AI Visibility Audit; +https://genessa.io)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    row.status_code      = res.status;
    row.final_url        = res.url;
    row.is_https         = res.url.startsWith("https://");
    row.response_time_ms = Date.now() - t0;

    if (res.ok) html = await readBodyCapped(res);
  } catch (err) {
    row.error_message = `Homepage fetch failed: ${err.message}`;
    row.is_https = false;
    row.is_server_side_rendered = false;
  }

  // ── 2. Parse HTML ────────────────────────────────────────────────────────────
  if (html) {
    row.title                   = extractTitle(html);
    row.meta_description        = extractMetaDescription(html);
    const ogTags                = extractOgTags(html);
    row.og_tags                 = ogTags;
    row.has_og_tags             = Object.keys(ogTags).length > 0;
    row.og_title                = ogTags.title ?? null;
    row.og_description          = ogTags.description ?? null;
    row.og_image                = ogTags.image ?? null;
    row.has_twitter_card        = Boolean(extractTwitterCard(html));
    const jsonLdBlocks          = extractJsonLd(html);
    row.has_json_ld             = jsonLdBlocks.length > 0;
    row.schema_types            = extractSchemaTypes(jsonLdBlocks);
    row.schema_raw              = jsonLdBlocks.slice(0, 3);
    const entities              = hasEntityLinks(html);
    row.has_wikidata_link       = entities.wikidata;
    row.has_wikipedia_link      = entities.wikipedia;
    row.is_server_side_rendered = detectSSR(html);
  }

  // ── 3. Robots.txt ────────────────────────────────────────────────────────────
  try {
    const rRes = await fetchWithTimeout(`${origin}/robots.txt`, {
      headers: { "User-Agent": "Genessa-Scanner/1.0" },
    }, 8_000);
    if (rRes.ok && rRes.headers.get("content-type")?.includes("text")) {
      const rBody = await readBodyCapped(rRes, MAX_ROBOTS_BYTES);
      row.robots_accessible = true;
      row.robots_content    = rBody.slice(0, 4000);
      row.ai_bot_permissions = parseRobotsTxt(rBody);

      // Extract sitemap URL from robots.txt
      const sitemapLine = rBody.match(/^Sitemap:\s*(.+)$/im);
      if (sitemapLine) row._sitemapFromRobots = sitemapLine[1].trim();
    } else {
      row.robots_accessible  = false;
      row.ai_bot_permissions = Object.fromEntries(AI_BOTS.map(b => [b, "unknown"]));
    }
  } catch {
    row.robots_accessible  = false;
    row.ai_bot_permissions = Object.fromEntries(AI_BOTS.map(b => [b, "unknown"]));
  }

  // ── 4. Sitemap ───────────────────────────────────────────────────────────────
  const sitemapCandidates = [
    row._sitemapFromRobots,
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap/sitemap.xml`,
  ].filter(Boolean);

  for (const url of sitemapCandidates) {
    try {
      const sRes = await fetchWithTimeout(url, {}, 6_000);
      if (sRes.ok) {
        row.sitemap_accessible = true;
        row.sitemap_url        = url;
        break;
      }
    } catch { /* try next */ }
  }
  if (!row.sitemap_accessible) row.sitemap_accessible = false;

  // ── 5. llms.txt ──────────────────────────────────────────────────────────────
  try {
    const lRes = await fetchWithTimeout(`${origin}/llms.txt`, {}, 6_000);
    if (lRes.ok) {
      const lBody = await readBodyCapped(lRes, 16_000);
      row.llms_txt_accessible = true;
      row.llms_txt_content    = lBody.slice(0, 2000);
    } else {
      row.llms_txt_accessible = false;
    }
  } catch {
    row.llms_txt_accessible = false;
  }

  // ── 6. Evaluate checks + score ───────────────────────────────────────────────
  delete row._sitemapFromRobots; // internal scratch field
  row.checks          = evaluateChecks(row);
  row.technical_score = computeTechnicalScore(row.checks);

  // ── 7. Save to Supabase ──────────────────────────────────────────────────────
  if (opts.supabase) {
    const { data: inserted, error } = await opts.supabase
      .from("technical_scans")
      .insert({
        organization_id:         row.organization_id,
        report_id:               row.report_id,
        domain:                  row.domain,
        final_url:               row.final_url,
        status_code:             row.status_code,
        response_time_ms:        row.response_time_ms,
        is_https:                row.is_https,
        is_server_side_rendered: row.is_server_side_rendered,
        title:                   row.title,
        meta_description:        row.meta_description,
        has_og_tags:             row.has_og_tags,
        og_title:                row.og_title,
        og_description:          row.og_description,
        og_image:                row.og_image,
        has_twitter_card:        row.has_twitter_card,
        has_json_ld:             row.has_json_ld,
        schema_types:            row.schema_types,
        schema_raw:              row.schema_raw,
        robots_accessible:       row.robots_accessible,
        robots_content:          row.robots_content,
        ai_bot_permissions:      row.ai_bot_permissions,
        sitemap_accessible:      row.sitemap_accessible,
        sitemap_url:             row.sitemap_url,
        llms_txt_accessible:     row.llms_txt_accessible,
        llms_txt_content:        row.llms_txt_content,
        has_wikidata_link:       row.has_wikidata_link,
        has_wikipedia_link:      row.has_wikipedia_link,
        checks:                  row.checks,
        technical_score:         row.technical_score,
        error_message:           row.error_message,
      })
      .select()
      .single();

    if (error) console.error("[tech-scanner] Supabase insert error:", error.message);
    else return inserted;
  }

  return row;
}

// ── CLI entry point ────────────────────────────────────────────────────────────

function parseCLIArgs(argv) {
  const positional = argv.filter(a => !a.startsWith("--"));
  const flags      = Object.fromEntries(
    argv.filter(a => a.startsWith("--")).map(a => {
      const [k, ...v] = a.slice(2).split("=");
      return [k, v.join("=") || true];
    })
  );
  return { domain: positional[0], orgId: flags["org-id"], reportId: flags["report-id"] };
}

if (process.argv[1] && new URL(process.argv[1], import.meta.url).pathname === new URL(import.meta.url).pathname) {
  const { domain, orgId, reportId } = parseCLIArgs(process.argv.slice(2));

  if (!domain) {
    console.error("Usage: node scripts/tech-scanner.mjs <domain> [--org-id=<uuid>] [--report-id=<uuid>]");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    console.error("[tech-scanner] Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`[tech-scanner] Scanning ${domain}…`);
  const result = await scanDomain(domain, { orgId, reportId, supabase });

  console.log("\n── Results ──────────────────────────────────────────────────");
  console.log(`Domain:          ${result.domain}`);
  console.log(`Final URL:       ${result.final_url ?? "—"}`);
  console.log(`HTTPS:           ${result.is_https ? "✓" : "✗"}`);
  console.log(`SSR:             ${result.is_server_side_rendered ? "✓" : "✗"}`);
  console.log(`Title:           ${result.title ?? "—"}`);
  console.log(`Meta desc:       ${result.meta_description ? result.meta_description.slice(0, 80) + "…" : "—"}`);
  console.log(`Schema types:    ${result.schema_types?.join(", ") || "none"}`);
  console.log(`OG tags:         ${result.has_og_tags ? "✓" : "✗"}`);
  console.log(`Robots.txt:      ${result.robots_accessible ? "✓" : "✗"}`);
  console.log(`Sitemap:         ${result.sitemap_accessible ? result.sitemap_url : "✗"}`);
  console.log(`llms.txt:        ${result.llms_txt_accessible ? "✓" : "✗"}`);
  console.log(`Wikidata link:   ${result.has_wikidata_link ? "✓" : "✗"}`);
  console.log(`Wikipedia link:  ${result.has_wikipedia_link ? "✓" : "✗"}`);

  console.log("\n── AI Bot Permissions ───────────────────────────────────────");
  for (const [bot, status] of Object.entries(result.ai_bot_permissions ?? {})) {
    const icon = status === "allowed" ? "✓" : status === "blocked" ? "✗" : "?";
    console.log(`  ${icon} ${bot.padEnd(22)} ${status}`);
  }

  console.log("\n── Checks ───────────────────────────────────────────────────");
  for (const [key, check] of Object.entries(result.checks)) {
    const icon = check.status === "pass" ? "✓" : check.status === "partial" ? "~" : "✗";
    console.log(`  ${icon} [${String(check.weight).padStart(2)}pts] ${key.padEnd(20)} ${check.detail.slice(0, 80)}`);
  }

  console.log(`\n── Technical Score: ${result.technical_score}/100 ──────────────────────────`);
  if (result.id) console.log(`   Saved → technical_scans.id = ${result.id}`);
}
