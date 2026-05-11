import { NextRequest } from "next/server";

export const runtime = "edge";

interface CheckResult {
  name: string;
  status: "pass" | "partial" | "fail";
  points: number;
  weight: number;
  impact: string;
  action: string;
}

async function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "GenessaBot/1.0" } });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchHTML(domain: string): Promise<string> {
  try {
    const res = await fetchWithTimeout(`https://${domain}`);
    return await res.text();
  } catch {
    try {
      const res = await fetchWithTimeout(`http://${domain}`);
      return await res.text();
    } catch {
      return "";
    }
  }
}

function checkSchema(html: string): CheckResult {
  const weight = 15;
  const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];

  if (scripts.length > 0) {
    let valid = 0;
    for (const s of scripts) {
      const content = s.replace(/<\/?script[^>]*>/gi, "").trim();
      try {
        JSON.parse(content);
        valid++;
      } catch { /* skip invalid */ }
    }
    if (valid > 0) {
      return {
        name: "Schema.org",
        status: "pass",
        points: weight,
        weight,
        impact: "Increases likelihood of ChatGPT citing your source",
        action: `${valid} JSON-LD blocks found`,
      };
    }
  }

  const hasMicrodata = /itemscope|itemtype/i.test(html);
  if (hasMicrodata) {
    return {
      name: "Schema.org",
      status: "partial",
      points: Math.round(weight * 0.5),
      weight,
      impact: "Microdata found but JSON-LD is preferred",
      action: "Add JSON-LD to homepage → +8 points",
    };
  }

  return {
    name: "Schema.org",
    status: "fail",
    points: 0,
    weight,
    impact: "AI bots struggle to understand content without structured data",
    action: "Add JSON-LD to homepage → +15 points",
  };
}

async function checkLlmsTxt(domain: string): Promise<CheckResult> {
  const weight = 10;
  try {
    const res = await fetchWithTimeout(`https://${domain}/llms.txt`);
    if (res.ok) {
      const text = await res.text();
      if (text.length > 20) {
        return {
          name: "llms.txt",
          status: "pass",
          points: weight,
          weight,
          impact: "AI bots can read your content directly",
          action: "llms.txt is present and valid",
        };
      }
    }
  } catch { /* fail */ }

  return {
    name: "llms.txt",
    status: "fail",
    points: 0,
    weight,
    impact: "AI bots cannot understand your content",
    action: "Create llms.txt file → +10 points",
  };
}

async function checkRobotsTxt(domain: string): Promise<CheckResult> {
  const weight = 10;
  const bots = ["GPTBot", "ClaudeBot", "PerplexityBot"];

  try {
    const res = await fetchWithTimeout(`https://${domain}/robots.txt`);
    if (!res.ok) {
      return {
        name: "Robots.txt",
        status: "fail",
        points: 0,
        weight,
        impact: "robots.txt not found — AI bot access policy unclear",
        action: "Create robots.txt and allow AI bots → +10 points",
      };
    }

    const text = await res.text();
    const lower = text.toLowerCase();

    let allowed = 0;
    const blocked: string[] = [];

    for (const bot of bots) {
      const botSection = new RegExp(`user-agent:\\s*${bot.toLowerCase()}[\\s\\S]*?(?=user-agent:|$)`, "i");
      const match = lower.match(botSection);
      if (match) {
        if (/disallow:\s*\/\s*$/m.test(match[0])) {
          blocked.push(bot);
        } else {
          allowed++;
        }
      } else {
        const wildcardSection = lower.match(/user-agent:\s*\*[\s\S]*?(?=user-agent:|$)/i);
        if (wildcardSection && /disallow:\s*\/\s*$/m.test(wildcardSection[0])) {
          blocked.push(bot);
        } else {
          allowed++;
        }
      }
    }

    if (blocked.length === 0) {
      return { name: "Robots.txt", status: "pass", points: weight, weight, impact: "All AI bots have access", action: "robots.txt is properly configured" };
    }
    if (allowed > 0) {
      return {
        name: "Robots.txt",
        status: "partial",
        points: Math.round(weight * (allowed / bots.length)),
        weight,
        impact: `${blocked.join(", ")} blocked`,
        action: `Add ${blocked.join(", ")} Allow to robots.txt → +${weight - Math.round(weight * (allowed / bots.length))} points`,
      };
    }

    return {
      name: "Robots.txt",
      status: "fail",
      points: 0,
      weight,
      impact: "All AI bots are blocked",
      action: "Add GPTBot: Allow to robots.txt → +10 points",
    };
  } catch {
    return { name: "Robots.txt", status: "fail", points: 0, weight, impact: "robots.txt could not be read", action: "Create robots.txt → +10 points" };
  }
}

function checkOpenGraph(html: string): CheckResult {
  const weight = 10;
  const tags = ["og:title", "og:description", "og:image"];
  let found = 0;
  const missing: string[] = [];

  for (const tag of tags) {
    const regex = new RegExp(`<meta[^>]*property=["']${tag}["'][^>]*content=["'][^"']+["']`, "i");
    const regex2 = new RegExp(`<meta[^>]*content=["'][^"']+["'][^>]*property=["']${tag}["']`, "i");
    if (regex.test(html) || regex2.test(html)) {
      found++;
    } else {
      missing.push(tag);
    }
  }

  if (found === tags.length) {
    return { name: "Open Graph", status: "pass", points: weight, weight, impact: "AI and social media previews are complete", action: "All OG tags present" };
  }
  if (found > 0) {
    return {
      name: "Open Graph",
      status: "partial",
      points: Math.round(weight * (found / tags.length)),
      weight,
      impact: `Missing: ${missing.join(", ")}`,
      action: `Add ${missing.join(", ")} → +${weight - Math.round(weight * (found / tags.length))} points`,
    };
  }
  return {
    name: "Open Graph",
    status: "fail",
    points: 0,
    weight,
    impact: "Open Graph tags missing — no preview for AI and social sharing",
    action: "Add og:title, og:description, og:image → +10 points",
  };
}

function checkEntityLinks(html: string): CheckResult {
  const weight = 5;
  const wikidata = (html.match(/wikidata\.org/gi) || []).length;
  const wikipedia = (html.match(/wikipedia\.org/gi) || []).length;
  const total = wikidata + wikipedia;

  if (total >= 3) {
    return { name: "Entity Links", status: "pass", points: weight, weight, impact: "AI entity recognition accuracy is high", action: `${total} entity links found` };
  }
  if (total > 0) {
    return {
      name: "Entity Links",
      status: "partial",
      points: Math.round(weight * 0.5),
      weight,
      impact: `${total} entity links found, 3+ recommended`,
      action: `Add Wikidata/Wikipedia links → +${weight - Math.round(weight * 0.5)} points`,
    };
  }
  return {
    name: "Entity Links",
    status: "fail",
    points: 0,
    weight,
    impact: "No structured entity links found — AI cannot map to authoritative sources",
    action: "Add Wikidata or Wikipedia links → +5 points",
  };
}

function checkH1H2(html: string): CheckResult {
  const weight = 10;
  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  const h2s = (html.match(/<h2[\s>]/gi) || []).length;

  if (h1s === 1 && h2s >= 2) {
    return { name: "H1/H2 Structure", status: "pass", points: weight, weight, impact: "Clear heading hierarchy helps AI parse content", action: `${h1s} H1 and ${h2s} H2 tags found` };
  }
  if (h1s >= 1 && h2s >= 1) {
    const pts = Math.round(weight * 0.6);
    return {
      name: "H1/H2 Structure",
      status: "partial",
      points: pts,
      weight,
      impact: h1s > 1 ? "Multiple H1 tags found — use only one" : "Only one H2 found — add more structure",
      action: `Improve heading structure → +${weight - pts} points`,
    };
  }
  if (h1s >= 1) {
    return { name: "H1/H2 Structure", status: "partial", points: Math.round(weight * 0.4), weight, impact: "H1 found but no H2 — content lacks structure for AI", action: "Add H2 subheadings → +6 points" };
  }
  return { name: "H1/H2 Structure", status: "fail", points: 0, weight, impact: "No H1 tag — AI bots cannot identify page topic", action: "Add H1 and H2 tags → +10 points" };
}

function checkFreshness(html: string): CheckResult {
  const weight = 10;

  const hasPublishedTime = /property=["']article:(?:published|modified)_time["']/i.test(html);
  const timeElements = (html.match(/<time[^>]+datetime=["'][^"']+["']/gi) || []).length;
  const hasDateModified = /dateModified|datePublished/i.test(html);
  const recentYear = /\b202[4-6]\b/.test(html);

  const signals = [hasPublishedTime, timeElements > 0, hasDateModified].filter(Boolean).length;

  if (signals >= 2 && recentYear) {
    return { name: "Freshness", status: "pass", points: weight, weight, impact: "AI bots can verify your content is current", action: "Date signals present" };
  }
  if (signals >= 1 || recentYear) {
    const pts = Math.round(weight * 0.5);
    return { name: "Freshness", status: "partial", points: pts, weight, impact: "Some date signals found — explicit dates recommended", action: `Add article:published_time meta → +${weight - pts} points` };
  }
  return { name: "Freshness", status: "fail", points: 0, weight, impact: "No date signals — AI cannot verify content is current", action: "Add datePublished and dateModified → +10 points" };
}

async function checkSpeed(domain: string): Promise<CheckResult> {
  const weight = 15;
  const start = Date.now();
  try {
    const res = await fetchWithTimeout(`https://${domain}`, 8000);
    const ms = Date.now() - start;
    if (!res.ok) {
      return { name: "Page Speed", status: "fail", points: 0, weight, impact: "HTTP error — AI bots cannot access the page", action: "Fix server errors → +15 points" };
    }
    if (ms < 2000) {
      return { name: "Page Speed", status: "pass", points: weight, weight, impact: `Fast load (${ms}ms) — AI bots can crawl quickly`, action: `Page loads in ${ms}ms` };
    }
    if (ms < 5000) {
      const pts = Math.round(weight * 0.5);
      return { name: "Page Speed", status: "partial", points: pts, weight, impact: `Slow load (${ms}ms) — AI bots may skip your page`, action: `Optimize to under 2s → +${weight - pts} points` };
    }
    return { name: "Page Speed", status: "fail", points: 0, weight, impact: `Very slow (${ms}ms) — AI bots likely skip your site`, action: "Improve server response time → +15 points" };
  } catch {
    return { name: "Page Speed", status: "fail", points: 0, weight, impact: "Page timed out — AI bots cannot crawl it", action: "Improve server response time → +15 points" };
  }
}

function checkAnswerFirst(html: string): CheckResult {
  const weight = 15;

  const hasFaqSchema = /FAQPage/i.test(html);
  const hasHowToSchema = /HowTo/i.test(html);
  const hasDefinitionList = /<dl[\s>]/i.test(html);
  const hasSummaryOrTldr = /<summary[\s>]/i.test(html) || /\btl;dr\b/i.test(html);
  const hasAnswerHeading = /<h[12][^>]*>[^<]*(?:what\s+is|how\s+to|why\s+)/i.test(html);
  const hasBlockquote = /<blockquote/i.test(html);

  const signals = [hasFaqSchema || hasHowToSchema, hasDefinitionList, hasSummaryOrTldr, hasAnswerHeading, hasBlockquote].filter(Boolean).length;

  if ((hasFaqSchema || hasHowToSchema) && signals >= 2) {
    return { name: "Answer-first", status: "pass", points: weight, weight, impact: "AI bots can extract direct answers from your content", action: "FAQ/HowTo schema and answer patterns found" };
  }
  if (signals >= 2) {
    const pts = Math.round(weight * 0.6);
    return { name: "Answer-first", status: "partial", points: pts, weight, impact: "Some answer-first signals found", action: `Add FAQPage schema → +${weight - pts} points` };
  }
  if (signals >= 1) {
    const pts = Math.round(weight * 0.3);
    return { name: "Answer-first", status: "partial", points: pts, weight, impact: "Minimal answer-first content detected", action: `Add FAQ schema and lead answers → +${weight - pts} points` };
  }
  return { name: "Answer-first", status: "fail", points: 0, weight, impact: "No answer-first content — AI cannot extract quick answers", action: "Add FAQPage schema and lead paragraphs → +15 points" };
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return Response.json({ error: "url parameter is required" }, { status: 400 });
  }

  const domain = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();

  const [html, llmsResult, robotsResult, speedResult] = await Promise.all([
    fetchHTML(domain),
    checkLlmsTxt(domain),
    checkRobotsTxt(domain),
    checkSpeed(domain),
  ]);

  const schemaResult = checkSchema(html);
  const ogResult = checkOpenGraph(html);
  const entityResult = checkEntityLinks(html);
  const h1h2Result = checkH1H2(html);
  const freshnessResult = checkFreshness(html);
  const answerFirstResult = checkAnswerFirst(html);

  const checks: CheckResult[] = [schemaResult, llmsResult, robotsResult, ogResult, entityResult, h1h2Result, freshnessResult, speedResult, answerFirstResult];
  const score = checks.reduce((sum, c) => sum + c.points, 0);

  return Response.json({
    url: domain,
    score,
    checks,
  });
}
