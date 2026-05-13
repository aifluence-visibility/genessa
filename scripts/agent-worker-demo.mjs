#!/usr/bin/env node
/**
 * Demo worker: claims pending agent_runs, runs the real fetch_page_jsonld tool (homepage JSON-LD),
 * writes structured output_ref + task.output_summary. Uses service role (same pattern as a production worker).
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL or INTERNAL_API_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   INTERNAL_WORKER_BATCH — max pending rows per fetch (default 5)
 *   INTERNAL_WORKER_DELAY_MS — idle delay after claim before network work (default 400)
 *   INTERNAL_WORKER_POLL_MS — if > 0, loop forever (or until signal) with this delay between batches (default 0 = one shot)
 *   INTERNAL_WORKER_FETCH_RETRY_MS — backoff base when a fetch fails in poll mode (default 2000)
 *   INTERNAL_WORKER_FETCH_TIMEOUT_MS — per-request timeout for the JSON-LD tool (default 20000)
 *   INTERNAL_WORKER_MAX_BODY_BYTES — max HTML bytes read (default 1500000)
 *   INTERNAL_WORKER_STUB=1 — skip HTTP and use legacy stub findings (offline tests only)
 *   OPENAI_API_KEY (or GENESSA_OPENAI_API_KEY) — when set and stub off, run consult_brief after fetch_page_jsonld
 *   INTERNAL_WORKER_LLM=0 — disable LLM even if a key is set
 *   OPENAI_BASE_URL — API base (default https://api.openai.com/v1)
 *   INTERNAL_WORKER_OPENAI_MODEL or OPENAI_MODEL — default gpt-4o-mini
 *   INTERNAL_WORKER_LLM_TIMEOUT_MS — OpenAI call timeout (default 90000)
 *   INTERNAL_WORKER_STALE_RUNNING_MS — fail `running` rows older than this (started_at, else created_at if started_at null); 0 disables (default 900000 = 15m)
 *   INTERNAL_WORKER_LLM_TASK_TYPES — optional comma-separated substrings; LLM runs only if task type matches (case-insensitive). Unset = all task types.
 *
 * Usage:
 *   npm run worker:agent-demo
 *   INTERNAL_WORKER_POLL_MS=5000 npm run worker:agent-demo
 */
import { createClient } from "@supabase/supabase-js";
import { runFetchPageJsonld } from "./tools/fetch-page-jsonld.mjs";
import { runConsultBrief } from "./tools/llm-consult-brief.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.INTERNAL_API_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const batch = Math.max(1, parseInt(process.env.INTERNAL_WORKER_BATCH ?? "5", 10) || 5);
const delayMs = Math.max(0, parseInt(process.env.INTERNAL_WORKER_DELAY_MS ?? "400", 10) || 400);
const pollMs = Math.max(0, parseInt(process.env.INTERNAL_WORKER_POLL_MS ?? "0", 10) || 0);
const fetchRetryMs = Math.max(500, parseInt(process.env.INTERNAL_WORKER_FETCH_RETRY_MS ?? "2000", 10) || 2000);
const fetchTimeoutMs = Math.max(3000, parseInt(process.env.INTERNAL_WORKER_FETCH_TIMEOUT_MS ?? "20000", 10) || 20000);
const maxBodyBytes = Math.max(50_000, parseInt(process.env.INTERNAL_WORKER_MAX_BODY_BYTES ?? "1500000", 10) || 1_500_000);
const stubMode = ["1", "true", "yes"].includes(String(process.env.INTERNAL_WORKER_STUB ?? "").toLowerCase());
const staleRunningMs = Math.max(0, parseInt(process.env.INTERNAL_WORKER_STALE_RUNNING_MS ?? "900000", 10) || 900000);
const taskSummaryMaxRetries = 2;

function parseLlmTaskTypeNeedles() {
  const raw = process.env.INTERNAL_WORKER_LLM_TASK_TYPES?.trim();
  if (!raw) {
    return null;
  }
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function taskMatchesLlmFilter(taskLabel) {
  const needles = parseLlmTaskTypeNeedles();
  if (!needles || needles.length === 0) {
    return true;
  }
  const hay = String(taskLabel ?? "").toLowerCase();
  return needles.some((n) => hay.includes(n));
}

function getLlmCredentials() {
  if (stubMode) {
    return null;
  }
  if (["0", "false", "no"].includes(String(process.env.INTERNAL_WORKER_LLM ?? "").toLowerCase())) {
    return null;
  }
  const apiKey = process.env.OPENAI_API_KEY?.trim() || process.env.GENESSA_OPENAI_API_KEY?.trim() || "";
  if (!apiKey) {
    return null;
  }
  const model =
    process.env.INTERNAL_WORKER_OPENAI_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini";
  const baseUrl = process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1";
  const timeoutMs = Math.min(
    Math.max(parseInt(process.env.INTERNAL_WORKER_LLM_TIMEOUT_MS ?? "90000", 10) || 90_000, 10_000),
    180_000,
  );
  return { apiKey, model, baseUrl, timeoutMs };
}

/** consult_brief when credentials exist, global LLM not disabled, and optional task-type filter passes. */
function getLlmConfigForTask(ctxTaskType, runTypeSnapshot) {
  const creds = getLlmCredentials();
  if (!creds) {
    return { run: false };
  }
  const label = ctxTaskType ?? runTypeSnapshot ?? "";
  if (!taskMatchesLlmFilter(label)) {
    return { run: false };
  }
  return { run: true, ...creds };
}

if (!url || !key) {
  console.error(
    "[agent-worker-demo] Set NEXT_PUBLIC_SUPABASE_URL (or INTERNAL_API_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let shuttingDown = false;

function setupSignals() {
  for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, () => {
      shuttingDown = true;
      console.warn(`[agent-worker-demo] ${sig}, finish current work then exit…`);
    });
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Wall-clock segments + optional OpenAI usage → output_ref.metrics
 */
function attachProcessingMetrics(outputRef, { stub, tProc0, fetchWallMs, llmWallMs }) {
  const wall_ms = {
    total_processing_ms: Date.now() - tProc0,
  };
  if (typeof fetchWallMs === "number") {
    wall_ms.fetch_page_jsonld_ms = fetchWallMs;
  }
  if (typeof llmWallMs === "number") {
    wall_ms.consult_brief_ms = llmWallMs;
  }

  const metrics = {
    worker: "agent-worker-demo",
    stub: Boolean(stub),
    wall_ms,
  };

  const usage = outputRef?.llm?.usage;
  if (usage && typeof usage === "object") {
    const p = usage.prompt_tokens;
    const c = usage.completion_tokens;
    const t = usage.total_tokens;
    if (typeof p === "number" || typeof c === "number" || typeof t === "number") {
      metrics.llm_tokens = {
        ...(typeof p === "number" ? { prompt: p } : {}),
        ...(typeof c === "number" ? { completion: c } : {}),
        ...(typeof t === "number" ? { total: t } : {}),
      };
    }
  }

  return { ...outputRef, metrics };
}

function pollDelayWithJitter() {
  return pollMs + Math.floor(Math.random() * 400);
}

async function fetchPending() {
  return supabase
    .from("agent_runs")
    .select("id, task_id, task_type_snapshot, run_key")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(batch);
}

/**
 * Optimistic claim: only the first worker to flip pending→running owns the row.
 */
async function loadTaskContext(taskId) {
  const { data, error } = await supabase
    .from("tasks")
    .select(
      "id, task_type, title, metadata, engagements ( client_accounts ( primary_domain ) )",
    )
    .eq("id", taskId)
    .maybeSingle();

  if (error) {
    return { ok: false, error };
  }
  if (!data) {
    return { ok: false, error: new Error("task_not_found") };
  }

  const domain = data.engagements?.client_accounts?.primary_domain ?? null;

  const meta = data.metadata && typeof data.metadata === "object" ? data.metadata : {};
  const targetUrl = meta.agent?.target_url ?? meta.target_url ?? null;

  return {
    ok: true,
    taskType: data.task_type,
    title: data.title,
    primaryDomain: domain,
    targetUrl,
  };
}

async function tryClaimRun(run) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("agent_runs")
    .update({ status: "running", started_at: now })
    .eq("id", run.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, reason: error };
  }
  if (!data) {
    return { ok: false, reason: "lost_claim" };
  }
  return { ok: true };
}

async function markRunFailed(runId, message) {
  const msg = String(message ?? "error").slice(0, 2000);
  const { error } = await supabase
    .from("agent_runs")
    .update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error_message: msg,
    })
    .eq("id", runId)
    .eq("status", "running");

  if (error) {
    console.error("[agent-worker-demo] markRunFailed", runId, error);
  }
}

async function completeRunSucceeded(run, outputRef, summary) {
  const { data, error } = await supabase
    .from("agent_runs")
    .update({
      status: "succeeded",
      finished_at: new Date().toISOString(),
      output_ref: outputRef,
      error_message: null,
    })
    .eq("id", run.id)
    .eq("status", "running")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[agent-worker-demo] completeRunSucceeded", run.id, error);
    return false;
  }
  if (!data) {
    console.warn("[agent-worker-demo] complete skipped (not running or lost race)", run.id);
    return false;
  }

  for (let attempt = 1; attempt <= taskSummaryMaxRetries; attempt++) {
    const { data: task } = await supabase.from("tasks").select("output_summary").eq("id", run.task_id).maybeSingle();
    const prev = task?.output_summary ?? "";
    const next = prev ? `${prev}\n\n${summary}` : summary;

    const { error: taskErr } = await supabase.from("tasks").update({ output_summary: next }).eq("id", run.task_id);

    if (!taskErr) {
      console.log("[agent-worker-demo] OK", run.id, run.run_key);
      return true;
    }
    console.error("[agent-worker-demo] task update", run.id, `attempt ${attempt}`, taskErr);
    if (attempt < taskSummaryMaxRetries) {
      await sleep(300 * attempt);
    }
  }
  console.error(
    "[agent-worker-demo] CRITICAL: run succeeded in DB but task.output_summary update failed after retries",
    run.id,
  );
  return true;
}

async function processOne(run) {
  const claimed = await tryClaimRun(run);
  if (!claimed.ok) {
    if (claimed.reason !== "lost_claim") {
      console.error("[agent-worker-demo] claim failed", run.id, claimed.reason);
    }
    return;
  }

  try {
    const tProc0 = Date.now();
    await sleep(delayMs);

    const ctx = await loadTaskContext(run.task_id);
    if (!ctx.ok) {
      console.error("[agent-worker-demo] load task", run.task_id, ctx.error);
      await markRunFailed(run.id, ctx.error instanceof Error ? ctx.error.message : String(ctx.error));
      return;
    }

    let outputRef;
    let summary;

    if (stubMode) {
      const stubFindings = [
        "CollegeOrUniversity JSON-LD present on homepage (stub)",
        "Faculty template: missing author sameAs on 2 URLs (demo stub)",
      ];
      summary = `[agent stub ${run.task_type_snapshot ?? "task"}] ${stubFindings.join(" · ")}`;
      outputRef = {
        demo: true,
        stub: true,
        worker: "scripts/agent-worker-demo.mjs",
        findings: stubFindings,
      };
      outputRef = attachProcessingMetrics(outputRef, {
        stub: true,
        tProc0,
        fetchWallMs: null,
        llmWallMs: null,
      });
    } else {
      const tFetch0 = Date.now();
      const tool = await runFetchPageJsonld({
        targetUrl: ctx.targetUrl,
        primaryDomain: ctx.primaryDomain,
        fetchTimeoutMs,
        maxBodyBytes,
      });
      const fetchWallMs = Date.now() - tFetch0;
      if (!tool.ok) {
        await markRunFailed(run.id, tool.message);
        return;
      }
      outputRef = tool.outputRef;
      summary = tool.summary;

      let llmWallMs = null;
      const llmCfg = getLlmConfigForTask(ctx.taskType, run.task_type_snapshot);
      if (llmCfg.run) {
        const tLlm0 = Date.now();
        const llm = await runConsultBrief({
          apiKey: llmCfg.apiKey,
          baseUrl: llmCfg.baseUrl,
          model: llmCfg.model,
          title: ctx.title,
          taskType: ctx.taskType,
          toolRef: outputRef,
          timeoutMs: llmCfg.timeoutMs,
        });
        llmWallMs = Date.now() - tLlm0;
        if (llm.kind === "brief") {
          outputRef = {
            ...outputRef,
            llm: {
              tool: "consult_brief",
              model: llm.model,
              brief: llm.brief,
              usage: llm.usage ?? null,
            },
          };
          summary = `${summary}\n\nConsultant brief (LLM):\n${llm.brief}`;
        } else {
          outputRef = {
            ...outputRef,
            llm: {
              tool: "consult_brief",
              model: llm.model || llmCfg.model,
              error: llm.message,
            },
          };
          console.warn("[agent-worker-demo] LLM skipped or failed:", llm.message);
        }
      }

      outputRef = attachProcessingMetrics(outputRef, {
        stub: false,
        tProc0,
        fetchWallMs,
        llmWallMs,
      });
    }

    const ok = await completeRunSucceeded(run, outputRef, summary);
    if (!ok) {
      await markRunFailed(run.id, "Run was not in running state when completing (cancelled or concurrent update).");
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[agent-worker-demo] process error", run.id, msg);
    await markRunFailed(run.id, msg);
  }
}

async function recoverStaleRunningRuns() {
  if (staleRunningMs <= 0) {
    return;
  }
  const cutoff = new Date(Date.now() - staleRunningMs).toISOString();
  const msg = `stale_running: exceeded ${staleRunningMs}ms in running state (worker recovery)`.slice(0, 2000);
  const patch = {
    status: "failed",
    finished_at: new Date().toISOString(),
    error_message: msg,
  };

  const { data: withStart, error: err1 } = await supabase
    .from("agent_runs")
    .update(patch)
    .eq("status", "running")
    .not("started_at", "is", null)
    .lt("started_at", cutoff)
    .select("id");

  const { data: noStart, error: err2 } = await supabase
    .from("agent_runs")
    .update(patch)
    .eq("status", "running")
    .is("started_at", null)
    .lt("created_at", cutoff)
    .select("id");

  if (err1) {
    console.error("[agent-worker-demo] stale recover (started_at)", err1);
  }
  if (err2) {
    console.error("[agent-worker-demo] stale recover (null started_at)", err2);
  }

  const n = (withStart?.length ?? 0) + (noStart?.length ?? 0);
  if (n > 0) {
    console.warn(`[agent-worker-demo] recovered ${n} stale running run(s) (cutoff ${cutoff})`);
  }
}

async function runBatch() {
  await recoverStaleRunningRuns();

  const { data: runs, error } = await fetchPending();

  if (error) {
    return { ok: false, error, empty: false };
  }
  if (!runs?.length) {
    return { ok: true, empty: true };
  }

  for (const run of runs) {
    if (shuttingDown) {
      break;
    }
    await processOne(run);
  }

  return { ok: true, empty: false };
}

async function mainLoop() {
  setupSignals();
  const creds = getLlmCredentials();
  const llmFilter = process.env.INTERNAL_WORKER_LLM_TASK_TYPES?.trim() || "any";
  console.log(
    `[agent-worker-demo] poll=${pollMs}ms batch=${batch} delayMs=${delayMs} stub=${stubMode ? "yes" : "no"} llm=${creds ? "available" : "off"} llmTasks=${creds ? llmFilter : "n/a"} staleMs=${staleRunningMs}`,
  );

  let fetchFails = 0;

  while (!shuttingDown) {
    const result = await runBatch();

    if (!result.ok) {
      fetchFails += 1;
      console.error("[agent-worker-demo] fetch pending failed", result.error, `(fail #${fetchFails})`);
      const backoff = Math.min(fetchRetryMs * Math.min(fetchFails, 6), 60_000);
      await sleep(backoff);
      continue;
    }

    fetchFails = 0;

    if (result.empty) {
      console.log("[agent-worker-demo] idle (no pending runs)");
    }

    if (shuttingDown) {
      break;
    }

    await sleep(pollDelayWithJitter());
  }

  console.log("[agent-worker-demo] stopped.");
}

async function mainOnce() {
  const result = await runBatch();

  if (!result.ok) {
    console.error("[agent-worker-demo] fetch", result.error);
    process.exit(1);
  }

  if (result.empty) {
    console.log("[agent-worker-demo] No pending runs.");
    return;
  }
}

async function main() {
  if (pollMs > 0) {
    await mainLoop();
    return;
  }
  await mainOnce();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
