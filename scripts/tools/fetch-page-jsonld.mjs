/**
 * Tool: fetch_page_jsonld
 * Fetches a public HTML page (client homepage / task target), extracts JSON-LD script blocks,
 * and collects schema.org @type values (strings only; @graph supported).
 *
 * No third-party dependencies (Node 18+ fetch + streams).
 */

const TOOL_ID = "fetch_page_jsonld";
const TOOL_VERSION = 1;

/** @param {string} hostname */
function hostnameLooksBlocked(hostname) {
  const h = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!h || h === "localhost" || h === "0.0.0.0") return true;
  if (h.endsWith(".localhost") || h.endsWith(".local")) return true;

  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  return false;
}

/**
 * @param {{ targetUrl?: string | null, primaryDomain?: string | null }}
 * @returns {{ url: string } | { error: string }}
 */
export function resolveTargetUrl({ targetUrl, primaryDomain }) {
  const raw =
    (targetUrl && String(targetUrl).trim()) ||
    (primaryDomain && String(primaryDomain).trim() && `https://${String(primaryDomain).trim()}`) ||
    "";
  if (!raw) {
    return { error: "missing_target" };
  }
  try {
    let s = raw.trim();
    if (!/^https?:\/\//i.test(s)) {
      s = `https://${s}`;
    }
    const parsed = new URL(s);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { error: "unsupported_scheme" };
    }
    if (hostnameLooksBlocked(parsed.hostname)) {
      return { error: "blocked_host" };
    }
    return { url: parsed.toString() };
  } catch {
    return { error: "invalid_url" };
  }
}

const JSONLD_SCRIPT_RE =
  /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/**
 * @param {string} html
 * @returns {{ blocks: unknown[], parseErrors: string[] }}
 */
export function extractJsonLdBlocks(html) {
  const blocks = [];
  const parseErrors = [];
  let m;
  JSONLD_SCRIPT_RE.lastIndex = 0;
  while ((m = JSONLD_SCRIPT_RE.exec(html)) !== null) {
    const raw = m[1]?.trim() ?? "";
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch (e) {
      parseErrors.push(String(e instanceof Error ? e.message : e).slice(0, 240));
    }
  }
  return { blocks, parseErrors };
}

/** @param {unknown} node @param {Set<string>} out */
function collectTypes(node, out) {
  if (node == null) return;
  if (Array.isArray(node)) {
    for (const item of node) {
      collectTypes(item, out);
    }
    return;
  }
  if (typeof node !== "object") return;
  const o = /** @type {Record<string, unknown>} */ (node);
  if (typeof o["@graph"] === "object" && o["@graph"] !== null && Array.isArray(o["@graph"])) {
    collectTypes(o["@graph"], out);
  }
  const t = o["@type"];
  if (typeof t === "string") {
    out.add(t);
  } else if (Array.isArray(t)) {
    for (const x of t) {
      if (typeof x === "string") out.add(x);
    }
  }
  for (const k of Object.keys(o)) {
    if (k === "@context" || k === "@graph") continue;
    collectTypes(o[k], out);
  }
}

/**
 * @param {unknown[]} blocks
 * @returns {string[]}
 */
export function typesFromBlocks(blocks) {
  const out = new Set();
  for (const b of blocks) {
    collectTypes(b, out);
  }
  return [...out].sort((a, b) => a.localeCompare(b));
}

/**
 * @param {import('node:stream/web').ReadableStream<Uint8Array> | null | undefined} body
 * @param {number} maxBytes
 */
async function readTextLimited(body, maxBytes) {
  if (!body) return "";
  const reader = body.getReader();
  const dec = new TextDecoder("utf-8", { fatal: false });
  let out = "";
  let carried = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value?.byteLength) continue;
    if (carried + value.byteLength > maxBytes) {
      const take = maxBytes - carried;
      out += dec.decode(value.slice(0, take), { stream: true });
      carried += take;
      await reader.cancel();
      break;
    }
    carried += value.byteLength;
    out += dec.decode(value, { stream: true });
  }
  out += dec.decode();
  return out;
}

/**
 * @param {{
 *   targetUrl?: string | null,
 *   primaryDomain?: string | null,
 *   fetchTimeoutMs?: number,
 *   maxBodyBytes?: number,
 * }} opts
 * @returns {Promise<
 *   | { ok: true, outputRef: Record<string, unknown>, summary: string }
 *   | { ok: false, message: string }
 * >}
 */
export async function runFetchPageJsonld(opts) {
  const fetchTimeoutMs = Math.min(Math.max(opts.fetchTimeoutMs ?? 20_000, 3000), 120_000);
  const maxBodyBytes = Math.min(Math.max(opts.maxBodyBytes ?? 1_500_000, 50_000), 5_000_000);

  const resolved = resolveTargetUrl({
    targetUrl: opts.targetUrl,
    primaryDomain: opts.primaryDomain,
  });
  if ("error" in resolved) {
    const map = {
      missing_target: "No target URL: set client primary_domain or tasks.metadata.target_url (or agent.target_url).",
      invalid_url: "Invalid target URL.",
      unsupported_scheme: "Only http(s) targets are allowed.",
      blocked_host: "Target host is not allowed (SSR guard).",
    };
    return { ok: false, message: map[resolved.error] ?? resolved.error };
  }

  const { url: requestUrl } = resolved;
  const started = Date.now();

  let res;
  try {
    res = await fetch(requestUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(fetchTimeoutMs),
      headers: {
        "user-agent": "GenessaAgentWorker/1.0 (+fetch_page_jsonld)",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.5",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: `fetch failed: ${msg}`.slice(0, 2000) };
  }

  const elapsedMs = Date.now() - started;
  const contentType = res.headers.get("content-type") ?? "";

  let html;
  try {
    html = await readTextLimited(res.body, maxBodyBytes);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: `read body failed: ${msg}`.slice(0, 2000) };
  }

  const { blocks, parseErrors } = extractJsonLdBlocks(html);
  const types = typesFromBlocks(blocks);

  const outputRef = {
    tool: TOOL_ID,
    tool_version: TOOL_VERSION,
    request_url: requestUrl,
    final_url: res.url,
    http_status: res.status,
    ok_http: res.ok,
    content_type: contentType.slice(0, 200),
    elapsed_ms: elapsedMs,
    body_truncated: html.length >= maxBodyBytes,
    jsonld_block_count: blocks.length,
    types,
    jsonld_parse_errors: parseErrors.slice(0, 12),
    worker: "scripts/tools/fetch-page-jsonld.mjs",
  };

  const typesShort = types.length ? types.slice(0, 8).join(", ") : "—";
  const more = types.length > 8 ? ` (+${types.length - 8} more)` : "";
  const summary = `[fetch_page_jsonld] ${res.url} → HTTP ${res.status} · ${blocks.length} JSON-LD block(s) · types: ${typesShort}${more}`;

  return { ok: true, outputRef, summary };
}
