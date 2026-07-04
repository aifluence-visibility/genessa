/**
 * Tool: run-engine
 * Sends a visibility query to Claude, GPT, or Perplexity and returns the raw text response.
 *
 * Env (read by caller, passed as creds object):
 *   ANTHROPIC_API_KEY   — required for engine "claude"
 *   OPENAI_API_KEY      — required for engine "gpt"
 *   PERPLEXITY_API_KEY  — required for engine "perplexity"
 *   ENGINE_CLAUDE_MODEL    — default: claude-haiku-4-5-20251001
 *   ENGINE_GPT_MODEL       — default: gpt-4o-mini
 *   ENGINE_PERPLEXITY_MODEL — default: llama-3.1-sonar-small-128k-online
 */

const SYSTEM_PROMPT =
  "You are a knowledgeable assistant. Answer the user's question naturally and accurately. " +
  "When relevant, mention specific brands, companies, products, or services. " +
  "If you cite sources, include URLs.";

async function fetchWithTimeout(url, opts, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function runClaude(promptText, apiKey, model, timeoutMs) {
  const res = await fetchWithTimeout(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: promptText }],
      }),
    },
    timeoutMs,
  );

  if (!res.ok) {
    const err = await res.text().catch(() => `http_${res.status}`);
    return { error: `claude_http_${res.status}: ${err}`.slice(0, 500) };
  }

  const data = await res.json();
  const text = data?.content?.[0]?.text;
  if (!text) return { error: "claude_empty_response" };
  return { text, model };
}

async function runOpenAICompatible(promptText, apiKey, model, baseUrl, timeoutMs) {
  const res = await fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: promptText },
        ],
      }),
    },
    timeoutMs,
  );

  if (!res.ok) {
    const err = await res.text().catch(() => `http_${res.status}`);
    return { error: `${baseUrl}_http_${res.status}: ${err}`.slice(0, 500) };
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) return { error: "empty_response" };
  return { text, model };
}

/**
 * @param {"claude"|"gpt"|"perplexity"} engine
 * @param {string} promptText
 * @param {object} creds  — keys: anthropicKey, openaiKey, perplexityKey, models, timeoutMs
 * @returns {Promise<{text?: string, model?: string, error?: string}>}
 */
export async function runEngine(engine, promptText, creds) {
  const timeoutMs = creds.timeoutMs ?? 30_000;

  if (engine === "claude") {
    if (!creds.anthropicKey) return { error: "missing_anthropic_key" };
    const model = creds.models?.claude ?? "claude-haiku-4-5-20251001";
    return runClaude(promptText, creds.anthropicKey, model, timeoutMs);
  }

  if (engine === "gpt") {
    if (!creds.openaiKey) return { error: "missing_openai_key" };
    const model = creds.models?.gpt ?? "gpt-4o-mini";
    return runOpenAICompatible(promptText, creds.openaiKey, model, "https://api.openai.com/v1", timeoutMs);
  }

  if (engine === "perplexity") {
    if (!creds.perplexityKey) return { error: "missing_perplexity_key" };
    const model = creds.models?.perplexity ?? "sonar";
    return runOpenAICompatible(promptText, creds.perplexityKey, model, "https://api.perplexity.ai", timeoutMs);
  }

  return { error: `unknown_engine: ${engine}` };
}

/** Read engine credentials from environment. */
export function getEngineCredentials() {
  return {
    anthropicKey: process.env.ANTHROPIC_API_KEY?.trim() || "",
    openaiKey: process.env.OPENAI_API_KEY?.trim() || process.env.GENESSA_OPENAI_API_KEY?.trim() || "",
    perplexityKey: process.env.PERPLEXITY_API_KEY?.trim() || "",
    models: {
      claude: process.env.ENGINE_CLAUDE_MODEL?.trim() || "claude-haiku-4-5-20251001",
      gpt: process.env.ENGINE_GPT_MODEL?.trim() || "gpt-4o-mini",
      perplexity: process.env.ENGINE_PERPLEXITY_MODEL?.trim() || "sonar",
    },
    timeoutMs: Math.min(
      Math.max(parseInt(process.env.ENGINE_TIMEOUT_MS ?? "30000", 10) || 30_000, 5_000),
      120_000,
    ),
  };
}
