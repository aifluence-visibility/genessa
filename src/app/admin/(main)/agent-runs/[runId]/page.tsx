import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { getAdminAgentRunDetail } from "@/lib/db/admin/agent-run-detail";
import type { AgentRunListRow } from "@/lib/admin/mock/agent-runs";
import { AgentRunControls } from "@/components/admin/agent-runs/agent-run-controls";

type PageProps = {
  params: Promise<{ runId: string }>;
};

function runStatusBadge(s: AgentRunListRow["status"]) {
  switch (s) {
    case "Succeeded":
      return <StatusBadge variant="success">{s}</StatusBadge>;
    case "Running":
      return <StatusBadge variant="warning">{s}</StatusBadge>;
    case "Pending":
      return <StatusBadge variant="info">{s}</StatusBadge>;
    case "Failed":
      return <StatusBadge variant="danger">{s}</StatusBadge>;
    case "Cancelled":
      return <StatusBadge variant="neutral">{s}</StatusBadge>;
    default:
      return <StatusBadge variant="neutral">{s}</StatusBadge>;
  }
}

function pickLlm(ref: unknown): { model?: string; brief?: string; error?: string } | null {
  if (!ref || typeof ref !== "object") return null;
  const llm = (ref as Record<string, unknown>).llm;
  if (!llm || typeof llm !== "object") return null;
  const o = llm as Record<string, unknown>;
  return {
    model: typeof o.model === "string" ? o.model : undefined,
    brief: typeof o.brief === "string" ? o.brief : undefined,
    error: typeof o.error === "string" ? o.error : undefined,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { runId } = await params;
  const result = await getAdminAgentRunDetail(runId);
  if (result.source === "not_found") {
    return { title: "Agent run" };
  }
  return { title: `Run ${result.detail.id.slice(0, 8)}…` };
}

export default async function AdminAgentRunDetailPage({ params }: PageProps) {
  const { runId } = await params;
  const result = await getAdminAgentRunDetail(runId);
  if (result.source === "not_found") {
    notFound();
  }

  const { source, detail } = result;
  const llm = pickLlm(detail.outputRef);

  let jsonBlock: string;
  try {
    jsonBlock = JSON.stringify(detail.outputRef ?? {}, null, 2);
  } catch {
    jsonBlock = String(detail.outputRef);
  }

  const linkClass =
    "inline-flex h-9 items-center justify-center rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 text-sm font-medium text-[var(--ink-800)] hover:bg-[var(--ink-50)]";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title={`Run ${detail.id.slice(0, 8)}…`}
        description={
          <span className="text-[var(--ink-600)]">
            {detail.taskTitle}
            <span className="mx-2 text-[var(--ink-300)]">·</span>
            {detail.taskTypeSnapshot ?? "—"}
          </span>
        }
        actions={
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--border)] ${
              source === "database" ? "bg-emerald-50 text-emerald-900" : "bg-[var(--ink-0)] text-[var(--ink-600)]"
            }`}
          >
            {source === "database" ? "Live database" : "Mock / offline data"}
          </span>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/agent-runs" className={linkClass}>
          ← All agent runs
        </Link>
        {detail.engagementId ? (
          <Link href={`/admin/engagements/${detail.engagementId}`} className={linkClass}>
            Engagement
          </Link>
        ) : null}
        {detail.engagementId ? (
          <Link href={`/admin/tasks?engagement=${detail.engagementId}`} className={linkClass}>
            Tasks (this program)
          </Link>
        ) : null}
      </div>

      <AgentRunControls runId={detail.id} statusDb={detail.statusDb} canMutate={source === "database"} />

      <Panel>
        <h2 className="text-sm font-semibold text-[var(--ink-900)]">Summary</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Run id</dt>
            <dd className="mt-0.5 break-all font-mono text-xs text-[var(--ink-800)]">{detail.id}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Status</dt>
            <dd className="mt-0.5">{runStatusBadge(detail.statusUi)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Client</dt>
            <dd className="mt-0.5 text-[var(--ink-800)]">{detail.clientName}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Run key</dt>
            <dd className="mt-0.5 break-all font-mono text-xs text-[var(--ink-800)]">{detail.runKey}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Task id</dt>
            <dd className="mt-0.5 break-all font-mono text-xs text-[var(--ink-800)]">{detail.taskId}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Wall</dt>
            <dd className="mt-0.5 tabular-nums text-[var(--ink-800)]">{detail.wallDuration}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Metrics</dt>
            <dd className="mt-0.5 text-[var(--ink-800)]">{detail.metricsSummary}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Created</dt>
            <dd className="mt-0.5 tabular-nums text-[var(--ink-800)]">{detail.createdAt}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Started</dt>
            <dd className="mt-0.5 tabular-nums text-[var(--ink-800)]">{detail.startedAt}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">Finished</dt>
            <dd className="mt-0.5 tabular-nums text-[var(--ink-800)]">{detail.finishedAt}</dd>
          </div>
        </dl>
      </Panel>

      {detail.errorMessage ? (
        <Panel>
          <h2 className="text-sm font-semibold text-red-900">Error</h2>
          <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-[var(--r-md)] bg-red-50 p-3 text-xs text-red-950">
            {detail.errorMessage}
          </pre>
        </Panel>
      ) : null}

      {llm && (llm.brief || llm.error) ? (
        <Panel>
          <h2 className="text-sm font-semibold text-[var(--ink-900)]">LLM · consult_brief</h2>
          {llm.model ? <p className="mt-1 text-xs text-[var(--ink-500)]">Model: {llm.model}</p> : null}
          {llm.brief ? (
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-[var(--r-md)] bg-[var(--ink-50)] p-3 text-sm text-[var(--ink-800)]">
              {llm.brief}
            </pre>
          ) : null}
          {llm.error ? (
            <p className="mt-3 rounded-[var(--r-md)] bg-amber-50 p-3 text-sm text-amber-950">LLM error: {llm.error}</p>
          ) : null}
        </Panel>
      ) : null}

      <Panel padding="p-0">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--ink-900)]">output_ref (JSON)</h2>
          <p className="mt-1 text-xs text-[var(--ink-500)]">Full structured payload stored on the run row.</p>
        </div>
        <pre className="max-h-[min(70vh,560px)] overflow-auto p-4 text-xs leading-relaxed text-[var(--ink-800)]">
          {jsonBlock}
        </pre>
      </Panel>
    </div>
  );
}
