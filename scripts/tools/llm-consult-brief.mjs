/**
 * Tool: consult_brief (LLM)
 * OpenAI Chat Completions via fetch (no extra npm deps).
 * Caller grounds the model only on `fetch_page_jsonld` output.
 */

function slimToolOutputForLlm(ref) {
  const types = Array.isArray(ref.types) ? ref.types.slice(0, 48).map(String) : [];
  const err = Array.isArray(ref.jsonld_parse_errors) ? ref.jsonld_parse_errors.slice(0, 5).map(String) : [];
  return {
    tool: ref.tool,
    request_url: ref.request_url,
    final_url: ref.final_url,
    http_status: ref.http_status,
    jsonld_block_count: ref.jsonld_block_count,
    types,
    jsonld_parse_errors: err,
  };
}

/**
 * @param {{
 *   apiKey: string,
 *   baseUrl?: string,
 *   model?: string,
 *   title: string,
 *   taskType: string,
 *   toolRef: Record<string, unknown>,
 *   timeoutMs?: number,
 * }} opts
 * @returns {Promise<
 *   | { kind: "brief", brief: string, model: string, usage?: unknown }
 *   | { kind: "error", message: string, model: string }
 * >}
 */
export async function runConsultBrief(opts) {
  const apiKey = opts.apiKey?.trim();
  if (!apiKey) {
    return { kind: "error", message: "missing_api_key", model: opts.model ?? "" };
  }

  const baseUrl = (opts.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = (opts.model ?? "gpt-4o-mini").trim();
  const timeoutMs = Math.min(Math.max(opts.timeoutMs ?? 90_000, 10_000), 180_000);

  const payload = slimToolOutputForLlm(opts.toolRef);
  const userBlock = [
    `Task type: ${opts.taskType}`,
    `Task title: ${opts.title}`,
    "",
    "Structured data snapshot (only trust this):",
    JSON.stringify(payload, null, 2),
    "",
    "Instructions: Respond with exactly 3–5 bullet lines for an internal AI-visibility consultant.",
    'Each line must start with "- ". No headings, no code fences.',
    "Use only facts supported by the snapshot; if JSON-LD types are empty, say structured data on the fetched URL is missing or not detected—do not invent entities or scores.",
  ].join("\n");

  const body = {
    model,
    temperature: 0.25,
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content:
          "You assist Genessa consultants. Be precise and conservative; never fabricate URLs or metrics.",
      },
      { role: "user", content: userBlock },
    ],
  };

  let res;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { kind: "error", message: `openai_fetch: ${msg}`.slice(0, 2000), model };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return { kind: "error", message: "openai_invalid_json_body", model };
  }

  if (!res.ok) {
    const errMsg =
      typeof data?.error?.message === "string"
        ? data.error.message
        : typeof data?.message === "string"
          ? data.message
          : `http_${res.status}`;
    return { kind: "error", message: `openai_http: ${errMsg}`.slice(0, 2000), model };
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    return { kind: "error", message: "openai_empty_completion", model };
  }

  return {
    kind: "brief",
    brief: content.trim(),
    model,
    usage: data.usage ?? undefined,
  };
}
