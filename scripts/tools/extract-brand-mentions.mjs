/**
 * Tool: extract-brand-mentions
 * Calls Claude to extract structured brand mention data from a raw engine response.
 *
 * Returns an array of mention objects ready to insert into brand_mentions table.
 */

async function fetchWithTimeout(url, opts, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function safeParseJSON(text) {
  try {
    return JSON.parse(text.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, ""));
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return null; }
    }
    return null;
  }
}

/**
 * @param {string} rawResponseText   — the engine's answer to the query
 * @param {string} promptText        — the original query
 * @param {string} orgName           — the organization's own brand/domain name
 * @param {string[]} competitorNames — list of known competitor names
 * @param {string} anthropicApiKey
 * @param {number} [timeoutMs]
 * @returns {Promise<Array<{brand_name,is_own_brand,position_in_response,sentiment,source_url}>>}
 */
export async function extractBrandMentions(
  rawResponseText,
  promptText,
  orgName,
  competitorNames,
  anthropicApiKey,
  timeoutMs = 60_000,
) {
  if (!anthropicApiKey?.trim()) return [];
  if (!rawResponseText?.trim()) return [];

  const ownBrandNorm = orgName.toLowerCase().replace(/\.(com|io|ai|co|net|org)$/, "");
  const competitorList = (competitorNames ?? []).join(", ") || "none provided";

  const userPrompt = `Query asked to AI: "${promptText}"

AI response to analyze:
---
${rawResponseText.slice(0, 3000)}
---

Own brand/domain to detect: "${orgName}" (variations: "${ownBrandNorm}")
Known competitors: ${competitorList}

Extract every distinct brand, company, product, or service mentioned in the response.

IMPORTANT — Do NOT extract these AI engine/platform names, they are infrastructure not competitors:
ChatGPT, GPT, GPT-4, GPT-4o, GPT-3.5, GPT-4 Turbo, OpenAI, Claude, Anthropic,
Perplexity, Perplexity AI, Google, Google AI, Gemini, Google Gemini, Bard,
Bing, Bing AI, Microsoft, Microsoft Copilot, Copilot, Meta, Meta AI, LLaMA, Llama,
Mistral, Mistral AI, Cohere, Grok, xAI, You.com, Pi, Amazon Alexa, Alexa,
Apple Intelligence, Siri, DeepSeek.

Return a JSON array ONLY (no markdown):
[
  {
    "brand_name": "exact name as written",
    "is_own_brand": true or false (true if it matches "${orgName}" or "${ownBrandNorm}"),
    "position_in_response": 1 (first mentioned = 1, second = 2, etc.),
    "sentiment": "positive" | "neutral" | "negative" (based on how the response portrays this brand),
    "source_url": "https://... or null" (only if the response explicitly links to this brand)
  }
]

If no brands are mentioned, return [].`;

  let res;
  try {
    res = await fetchWithTimeout(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          system: "You extract structured data from text. Respond with valid JSON arrays only. No prose.",
          messages: [{ role: "user", content: userPrompt }],
        }),
      },
      timeoutMs,
    );
  } catch (e) {
    console.error("[extract-brand-mentions] fetch error:", e?.message);
    return [];
  }

  if (!res.ok) {
    console.error("[extract-brand-mentions] claude error:", res.status);
    return [];
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text ?? "";
  const parsed = safeParseJSON(text);

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((m) => m?.brand_name && typeof m.brand_name === "string")
    .map((m, idx) => ({
      brand_name: String(m.brand_name).trim().slice(0, 200),
      is_own_brand: Boolean(m.is_own_brand),
      position_in_response: typeof m.position_in_response === "number" ? m.position_in_response : idx + 1,
      sentiment: ["positive", "neutral", "negative"].includes(m.sentiment) ? m.sentiment : "neutral",
      source_url: typeof m.source_url === "string" && m.source_url.startsWith("http") ? m.source_url : null,
    }));
}
