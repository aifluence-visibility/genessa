/**
 * Display helpers for agent_runs observability (duration, worker metrics on output_ref).
 */

export function formatAgentRunDuration(
  isoStarted: string | null | undefined,
  isoFinished: string | null | undefined,
): string {
  if (!isoStarted || !isoFinished) return "—";
  const a = new Date(isoStarted).getTime();
  const b = new Date(isoFinished).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return "—";
  const sec = (b - a) / 1000;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  if (sec < 3600) return `${(sec / 60).toFixed(1)}m`;
  return `${(sec / 3600).toFixed(1)}h`;
}

function secFromMs(ms: unknown): string | null {
  if (typeof ms !== "number" || !Number.isFinite(ms)) return null;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** one-line summary for table cell */
export function formatAgentRunMetricsSummary(outputRef: unknown): string {
  if (!outputRef || typeof outputRef !== "object") return "—";
  const ref = outputRef as Record<string, unknown>;
  const m = ref.metrics;
  if (!m || typeof m !== "object") return "—";
  const meta = m as Record<string, unknown>;
  const wall = meta.wall_ms;
  if (!wall || typeof wall !== "object") return "—";
  const w = wall as Record<string, unknown>;
  const parts: string[] = [];
  const f = secFromMs(w.fetch_page_jsonld_ms);
  if (f) parts.push(`fetch ${f}`);
  const l = secFromMs(w.consult_brief_ms);
  if (l) parts.push(`LLM ${l}`);
  const tot = secFromMs(w.total_processing_ms);
  if (tot && parts.length === 0) parts.push(`proc ${tot}`);
  const tok = meta.llm_tokens as Record<string, unknown> | undefined;
  if (tok && typeof tok.total === "number") {
    parts.push(`${tok.total} tok`);
  }
  return parts.length ? parts.join(" · ") : "—";
}
