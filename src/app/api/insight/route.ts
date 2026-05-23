import { NextRequest } from "next/server";

interface CheckResult {
  name: string;
  status: "pass" | "partial" | "fail";
  points: number;
  weight: number;
  impact: string;
  action: string;
}

interface AuditResponse {
  url: string;
  score: number;
  scores: {
    readiness: { score: number; checks: CheckResult[] };
    authority: { score: number | null; pending: boolean };
    influence: { score: number | null; locked: boolean };
  };
  checks: CheckResult[];
}

interface InsightResponse {
  hero_text: string | null;
  strongest_point: string | null;
  critical_gap: string | null;
  quick_win: string | null;
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

async function fetchPageTitle(domain: string): Promise<string> {
  try {
    const res = await fetchWithTimeout(`https://${domain}`);
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : domain;
  } catch {
    try {
      const res = await fetchWithTimeout(`http://${domain}`);
      const html = await res.text();
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      return titleMatch ? titleMatch[1].trim() : domain;
    } catch {
      return domain;
    }
  }
}

function buildTechnicalScan(checks: CheckResult[]): string {
  if (!checks?.length) return "No scan results available.";
  return checks.map((c) => `${c.name}: ${c.status}`).join("; ");
}

function safeParseJSON(text: string): any {
  try {
    return JSON.parse(text.trim());
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

const fallbackInsight: InsightResponse = {
  hero_text: "Technical signals detected, strategic analysis pending.",
  strongest_point: null,
  critical_gap: null,
  quick_win: null,
};

const SECTOR_LENSES: Record<string, { agentTitle: string; lens: string }> = {
  restaurant:  { agentTitle: "Restaurant Intelligence Operator",  lens: "Google Maps visibility, TripAdvisor presence, reservation funnel, local SEO" },
  hospitality: { agentTitle: "Hospitality Intelligence Operator", lens: "OTA presence, direct booking signals, experience content" },
  clinic:      { agentTitle: "Medical Intelligence Operator",     lens: "medical authority signals, patient acquisition, trust and accreditation" },
  education:   { agentTitle: "Education Intelligence Operator",   lens: "program pages, accreditation signals, international student content" },
  ecommerce:   { agentTitle: "Commerce Intelligence Operator",    lens: "product schema, review ecosystem, AI shopping visibility" },
  saas:        { agentTitle: "SaaS Intelligence Operator",        lens: "documentation quality, comparison pages, AI citation signals" },
  realestate:  { agentTitle: "Property Intelligence Operator",    lens: "neighbourhood authority, international buyer content" },
  legal:       { agentTitle: "Legal Intelligence Operator",       lens: "E-E-A-T signals, bar authority, accreditation markup" },
  finance:     { agentTitle: "Finance Intelligence Operator",     lens: "license signals, compliance content, advisor authority" },
  creator:     { agentTitle: "Creator Intelligence Operator",     lens: "thought leadership, platform presence, Wikidata authority" },
  marketing:   { agentTitle: "Marketing Intelligence Operator",   lens: "Clutch authority, case study depth, LinkedIn presence" },
};

function buildSystemPrompt(sector: string | null | undefined): string {
  const base = "You are an AI visibility analyst. Be specific, concise, no generic advice.";
  if (!sector) return base;
  const info = SECTOR_LENSES[sector];
  if (!info) return base;
  return `${base} This business is in the ${sector} sector. Analyze through the lens of a ${info.agentTitle}: focus on ${info.lens}. Tailor all insights, recommendations and action items specifically for this sector.`;
}

export async function POST(request: NextRequest) {
  let url: string | undefined;
  let sector: string | null = null;
  try {
    const body = await request.json();
    url = body.url;
    sector = body.sector ?? null;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!url) {
    return Response.json({ error: "url is required" }, { status: 400 });
  }

  const domain = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
  const origin = new URL(request.url).origin;

  try {
    const auditRes = await fetch(`${origin}/api/audit?url=${encodeURIComponent(domain)}`);
    if (!auditRes.ok) {
      return Response.json(fallbackInsight);
    }

    const auditData = (await auditRes.json()) as AuditResponse;
    const title = await fetchPageTitle(domain);
    const technicalScan = buildTechnicalScan(auditData.checks);
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return Response.json(fallbackInsight);
    }

    const prompt = `Analyze this website for AI visibility.\nDomain: ${domain}\nTitle: ${title}\nTechnical scan: ${technicalScan}\n\nReturn JSON only, no markdown:\n{\n  hero_text: string (max 20 words, specific to this site),\n  strongest_point: string (1 sentence),\n  critical_gap: string (1 sentence),\n  quick_win: string (1 sentence)\n}`;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        system: buildSystemPrompt(sector),
        messages: [
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      return Response.json(fallbackInsight);
    }

    const anthropicJson = await anthropicRes.json();
    const text =
      typeof anthropicJson?.content?.[0]?.text === "string"
        ? anthropicJson.content[0].text
        : "";

    const parsed = safeParseJSON(text);
    if (!parsed || typeof parsed !== "object") {
      return Response.json(fallbackInsight);
    }

    return Response.json({
      hero_text: typeof parsed.hero_text === "string" ? parsed.hero_text : fallbackInsight.hero_text,
      strongest_point: typeof parsed.strongest_point === "string" ? parsed.strongest_point : null,
      critical_gap: typeof parsed.critical_gap === "string" ? parsed.critical_gap : null,
      quick_win: typeof parsed.quick_win === "string" ? parsed.quick_win : null,
    });
  } catch {
    return Response.json(fallbackInsight);
  }
}
