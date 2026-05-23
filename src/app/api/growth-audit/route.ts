import { NextRequest } from "next/server";
import { getSectorPrompt } from "@/lib/sectorPrompts";

interface AgentResult {
  score: number;
  findings: string[];
  topFix: string;
}

interface PriorityAction {
  title: string;
  impact: "high" | "medium" | "low";
  effort: "quick" | "medium" | "long";
  agent: "technical" | "content" | "authority";
}

interface CacheEntry {
  response: unknown;
  timestamp: number;
}

const auditCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

function safeParseJSON(text: string): unknown {
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

async function callAgent(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
): Promise<unknown> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const text =
    typeof json?.content?.[0]?.text === "string" ? json.content[0].text : "";
  return safeParseJSON(text);
}

function validateAgentResult(raw: unknown): AgentResult {
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    score:
      typeof obj.score === "number"
        ? Math.max(0, Math.min(100, Math.round(obj.score)))
        : 50,
    findings: Array.isArray(obj.findings)
      ? (obj.findings as unknown[]).filter((f): f is string => typeof f === "string")
      : [],
    topFix:
      typeof obj.topFix === "string"
        ? obj.topFix
        : "Review and optimize AI visibility signals.",
  };
}

const TECHNICAL_SYSTEM_PROMPT = `You are a technical AI visibility specialist.
Analyze ONLY the technical signals of the given domain audit data.
Focus on: schema markup, llms.txt, robots.txt, page speed signals,
structured data completeness, Open Graph tags, sitemap.
Return JSON: { score: number (0-100), findings: string[], topFix: string }`;

const CONTENT_SYSTEM_PROMPT = `You are a content authority specialist for AI visibility.
Analyze ONLY the content signals of the given domain audit data.
Focus on: E-E-A-T signals, content freshness, heading structure,
answer-first formatting, FAQ presence, topic authority depth.
Return JSON: { score: number (0-100), findings: string[], topFix: string }`;

const AUTHORITY_SYSTEM_PROMPT = `You are a brand authority specialist for AI visibility.
Analyze ONLY the authority and trust signals of the given domain audit data.
Focus on: entity recognition, external mentions, trust signals,
social proof, industry associations, citation likelihood.
Return JSON: { score: number (0-100), findings: string[], topFix: string }`;

const ORCHESTRATOR_BASE_PROMPT = `You are the Genessa Growth Audit Orchestrator.
You receive three specialist reports (Technical, Content, Authority).
Synthesize them into ONE unified action plan.
Return JSON only, no markdown:
{
  "overallScore": number (weighted average: technical 40%, content 35%, authority 25%),
  "summary": string (2 sentences, sector-specific tone),
  "priorityActions": [
    { "title": string, "impact": "high"|"medium"|"low", "effort": "quick"|"medium"|"long", "agent": "technical"|"content"|"authority" }
  ],
  "agents": {
    "technical": { "score": number, "topFix": string },
    "content": { "score": number, "topFix": string },
    "authority": { "score": number, "topFix": string }
  }
}
Include max 5 priorityActions sorted by impact (high first).`;

export async function POST(request: NextRequest) {
  let domain: string;
  let sector: string;

  try {
    const body = await request.json();
    if (!body.domain || typeof body.domain !== "string") {
      return Response.json({ success: false, error: "domain is required" }, { status: 400 });
    }
    if (!body.sector || typeof body.sector !== "string") {
      return Response.json({ success: false, error: "sector is required" }, { status: 400 });
    }
    domain = body.domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
    sector = body.sector;
  } catch {
    return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const cacheKey = `${domain}:${sector}`;
  const now = Date.now();
  const cached = auditCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return Response.json(cached.response);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ success: false, error: "API key not configured" }, { status: 500 });
  }

  const agentUserMessage = `Domain: ${domain}\nSector: ${sector}\nAudit data: analyze based on domain name and sector context only.`;

  try {
    const rawTechnical = await callAgent(apiKey, TECHNICAL_SYSTEM_PROMPT, agentUserMessage);
    const technical = validateAgentResult(rawTechnical);

    const rawContent = await callAgent(apiKey, CONTENT_SYSTEM_PROMPT, agentUserMessage);
    const content = validateAgentResult(rawContent);

    const rawAuthority = await callAgent(apiKey, AUTHORITY_SYSTEM_PROMPT, agentUserMessage);
    const authority = validateAgentResult(rawAuthority);

    const orchestratorSystemPrompt = `${getSectorPrompt(sector)}\n\n${ORCHESTRATOR_BASE_PROMPT}`;

    const orchestratorUserMessage = `Domain: ${domain}
Sector: ${sector}

Technical Agent Report:
Score: ${technical.score}
Findings: ${technical.findings.join("; ") || "none"}
Top Fix: ${technical.topFix}

Content Agent Report:
Score: ${content.score}
Findings: ${content.findings.join("; ") || "none"}
Top Fix: ${content.topFix}

Authority Agent Report:
Score: ${authority.score}
Findings: ${authority.findings.join("; ") || "none"}
Top Fix: ${authority.topFix}

Synthesize these three reports into one unified action plan.`;

    const rawOrchestrator = await callAgent(apiKey, orchestratorSystemPrompt, orchestratorUserMessage);
    const orc = (rawOrchestrator ?? {}) as Record<string, unknown>;

    const computedOverallScore = Math.round(
      technical.score * 0.4 + content.score * 0.35 + authority.score * 0.25,
    );

    const rawActions = Array.isArray(orc.priorityActions) ? orc.priorityActions : [];
    const priorityActions: PriorityAction[] = rawActions
      .slice(0, 5)
      .filter((a): a is Record<string, unknown> => typeof a === "object" && a !== null)
      .map((a) => ({
        title: typeof a.title === "string" ? a.title : "Improve AI visibility signal",
        impact: (["high", "medium", "low"] as const).includes(a.impact as "high" | "medium" | "low")
          ? (a.impact as "high" | "medium" | "low")
          : "medium",
        effort: (["quick", "medium", "long"] as const).includes(a.effort as "quick" | "medium" | "long")
          ? (a.effort as "quick" | "medium" | "long")
          : "medium",
        agent: (["technical", "content", "authority"] as const).includes(a.agent as "technical" | "content" | "authority")
          ? (a.agent as "technical" | "content" | "authority")
          : "technical",
      }));

    const result = {
      success: true,
      domain,
      sector,
      overallScore:
        typeof orc.overallScore === "number"
          ? Math.max(0, Math.min(100, Math.round(orc.overallScore)))
          : computedOverallScore,
      summary:
        typeof orc.summary === "string"
          ? orc.summary
          : `Growth audit complete for ${domain}. Review priority actions below to improve AI visibility.`,
      priorityActions,
      agents: {
        technical: { score: technical.score, topFix: technical.topFix },
        content: { score: content.score, topFix: content.topFix },
        authority: { score: authority.score, topFix: authority.topFix },
      },
      generatedAt: new Date().toISOString(),
    };

    auditCache.set(cacheKey, { response: result, timestamp: now });
    return Response.json(result);
  } catch {
    return Response.json({ success: false, error: "Audit failed. Please try again." }, { status: 500 });
  }
}
