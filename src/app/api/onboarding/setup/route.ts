import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const PROMPT_TYPES = ["category", "solution", "comparison", "brand", "long_tail"] as const;

interface SetupBody {
  domain: string;
  locale: "tr-TR" | "en-US";
}

interface GeneratedPrompt {
  prompt_text: string;
  prompt_type: (typeof PROMPT_TYPES)[number];
}

interface GeneratedCompetitor {
  competitor_name: string;
  competitor_url: string | null;
}

interface ClaudeOutput {
  business_info: {
    sector: string;
    brand_name: string;
    main_services: string[];
    target_audience: string;
  };
  queries: GeneratedPrompt[];
  competitors: GeneratedCompetitor[];
}

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

async function fetchPageSnippet(domain: string): Promise<string> {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`https://${domain}`, {
      signal: controller.signal,
      headers: { "User-Agent": "GenessaBot/2.0" },
    });
    const html = await res.text();
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
    const desc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)/i)?.[1]?.trim() ?? "";
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
    return [title, desc, h1].filter(Boolean).join(" | ").slice(0, 400);
  } catch {
    return domain;
  }
}

async function callClaude(domain: string, snippet: string, locale: string): Promise<ClaudeOutput | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;

  const lang = locale === "tr-TR" ? "Turkish" : "English";
  const localeLabel = locale === "tr-TR" ? "Turkish market (Turkey)" : "English market (US/Global)";

  const userPrompt = `Website domain: ${domain}
Page content: ${snippet || domain}
Target language: ${lang}
Target market: ${localeLabel}

Analyze this website and return ONLY valid JSON with this exact structure:
{
  "business_info": {
    "sector": "one of: restaurant, clinic, saas, hotel, creator, legal, ecommerce, other",
    "brand_name": "the brand or company name",
    "main_services": ["service 1", "service 2", "service 3"],
    "target_audience": "brief description of who they serve"
  },
  "queries": [
    { "prompt_text": "query in ${lang}", "prompt_type": "category" },
    { "prompt_text": "query in ${lang}", "prompt_type": "category" },
    { "prompt_text": "query in ${lang}", "prompt_type": "category" },
    { "prompt_text": "query in ${lang}", "prompt_type": "solution" },
    { "prompt_text": "query in ${lang}", "prompt_type": "solution" },
    { "prompt_text": "query in ${lang}", "prompt_type": "solution" },
    { "prompt_text": "query in ${lang}", "prompt_type": "comparison" },
    { "prompt_text": "query in ${lang}", "prompt_type": "comparison" },
    { "prompt_text": "query in ${lang}", "prompt_type": "comparison" },
    { "prompt_text": "query in ${lang}", "prompt_type": "brand" },
    { "prompt_text": "query in ${lang}", "prompt_type": "brand" },
    { "prompt_text": "query in ${lang}", "prompt_type": "brand" },
    { "prompt_text": "query in ${lang}", "prompt_type": "long_tail" },
    { "prompt_text": "query in ${lang}", "prompt_type": "long_tail" },
    { "prompt_text": "query in ${lang}", "prompt_type": "long_tail" }
  ],
  "competitors": [
    { "competitor_name": "name", "competitor_url": "domain.com or null" },
    { "competitor_name": "name", "competitor_url": "domain.com or null" },
    { "competitor_name": "name", "competitor_url": "domain.com or null" },
    { "competitor_name": "name", "competitor_url": "domain.com or null" },
    { "competitor_name": "name", "competitor_url": "domain.com or null" }
  ]
}

Rules:
- ALL 15 queries must be in ${lang} — the exact language users type into ChatGPT or Claude
- category: "best [type of business]", "top [category] in [city/country]"
- solution: "how to [problem this business solves]", "where to find [service]"
- comparison: "[brand] vs [competitor]", "alternatives to [competitor]"
- brand: direct queries about this brand by name
- long_tail: specific, detailed queries a high-intent user would ask
- competitors: real businesses in the same market, same locale
- Return ONLY JSON, no markdown, no explanation`;

  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: "You are an AI visibility analyst. Extract business information and generate AI search queries. Respond only with valid JSON.",
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) return null;

  const json = await res.json();
  const text: string = json?.content?.[0]?.text ?? "";

  try {
    const raw = text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    return JSON.parse(raw) as ClaudeOutput;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]) as ClaudeOutput; } catch { return null; }
    }
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Auth check
  const serverClient = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await serverClient.auth.getUser();
  if (authErr || !user) return bad("unauthorized", 401);

  // Parse body
  let body: SetupBody;
  try {
    body = await req.json();
  } catch {
    return bad("invalid_json");
  }

  const domain = body.domain?.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();
  const locale = body.locale === "tr-TR" ? "tr-TR" : "en-US";

  if (!domain || domain.length < 3 || !domain.includes(".")) {
    return bad("invalid_domain");
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return bad("service_unavailable", 503);

  // Check if profile already has an org → reuse or clean up
  const { data: profile } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  let orgId: string;

  if (profile?.organization_id) {
    orgId = profile.organization_id;
    // Remove previous pending (unapproved) prompts and competitors so we start fresh
    await admin.from("engine_prompts").delete()
      .eq("organization_id", orgId)
      .eq("is_user_approved", false);
    await admin.from("tracked_competitors").delete()
      .eq("organization_id", orgId)
      .eq("is_user_added", false);
  } else {
    // Create a new organization for this user
    const { data: newOrg, error: orgErr } = await admin
      .from("organizations")
      .insert({ name: domain, slug: `${domain.replace(/\./g, "-")}-${user.id.slice(0, 8)}` })
      .select("id")
      .single();
    if (orgErr || !newOrg) return bad("org_creation_failed", 500);
    orgId = newOrg.id;
  }

  // Fetch page content for Claude context
  const snippet = await fetchPageSnippet(domain);

  // Call Claude to generate business info, queries, competitors
  const output = await callClaude(domain, snippet, locale);
  if (!output) return bad("analysis_failed", 500);

  // Validate and normalise Claude output
  const validTypes = new Set(PROMPT_TYPES as readonly string[]);
  const prompts = (output.queries ?? [])
    .filter((q) => q?.prompt_text && validTypes.has(q?.prompt_type))
    .slice(0, 20);

  const competitors = (output.competitors ?? [])
    .filter((c) => c?.competitor_name)
    .slice(0, 5);

  if (prompts.length === 0) return bad("no_queries_generated", 500);

  // Save prompts (is_user_approved: false — pending review)
  const { data: savedPrompts, error: promptErr } = await admin
    .from("engine_prompts")
    .insert(
      prompts.map((p) => ({
        organization_id: orgId,
        prompt_text: p.prompt_text,
        prompt_type: p.prompt_type,
        target_locale: locale,
        target_engines: ["claude", "gpt", "perplexity"],
        is_active: true,
        is_user_approved: false,
      }))
    )
    .select("id, prompt_text, prompt_type");

  if (promptErr || !savedPrompts) return bad("prompt_save_failed", 500);

  // Save competitors (is_user_added: false — AI-suggested)
  const savedCompetitors: { id: string; competitor_name: string; competitor_url: string | null }[] = [];
  if (competitors.length > 0) {
    const { data: comp } = await admin
      .from("tracked_competitors")
      .insert(
        competitors.map((c) => ({
          organization_id: orgId,
          competitor_name: c.competitor_name,
          competitor_url: c.competitor_url ?? null,
          is_user_added: false,
        }))
      )
      .select("id, competitor_name, competitor_url");
    if (comp) savedCompetitors.push(...comp);
  }

  return NextResponse.json({
    organization_id: orgId,
    business_info: output.business_info ?? null,
    prompts: savedPrompts,
    competitors: savedCompetitors,
  });
}
