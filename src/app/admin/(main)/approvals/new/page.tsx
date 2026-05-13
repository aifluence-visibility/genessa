import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { CreateApprovalForm } from "@/components/admin/approvals/create-approval-form";
import { getApprovalCreateFormData } from "@/lib/db/admin/approval-create-options";

export const metadata: Metadata = {
  title: "New approval",
};

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PageProps = {
  searchParams?: Promise<{ engagement?: string }>;
};

export default async function NewApprovalPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const engagementParam = sp.engagement?.trim() ?? "";
  const { source, engagements, tasks, reports } = await getApprovalCreateFormData(
    engagementParam || null,
  );

  const engagementValid = engagementParam && uuidRe.test(engagementParam);
  const engagementMeta = engagements.find((e) => e.id === engagementParam);
  const engagementLabel = engagementMeta?.label ?? (engagementValid ? engagementParam : "");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="New approval"
        description="Open a new human review queue item tied to one task output or one report artifact (Stage 1 internal)."
        actions={
          <Link
            href="/admin/approvals"
            className="text-sm font-medium text-[var(--genessa-blue)] hover:underline"
          >
            Back to queue
          </Link>
        }
      />

      {!engagementValid ? (
        <Panel padding="p-5" className="max-w-xl">
          <p className="mb-4 text-sm text-[var(--ink-600)]">Choose an engagement to load tasks and reports.</p>
          {source !== "database" ? (
            <p className="text-sm text-[var(--ink-500)]">Database not configured — cannot load engagements.</p>
          ) : (
            <form method="get" action="/admin/approvals/new" className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-[var(--ink-600)]">
                Engagement
                <select
                  name="engagement"
                  required
                  className="rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 py-2 text-sm text-[var(--ink-900)]"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {engagements.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-[var(--ink-900)] px-4 text-sm font-medium text-[var(--ink-0)] hover:opacity-95"
              >
                Continue
              </button>
            </form>
          )}
        </Panel>
      ) : (
        <Panel padding="p-5">
          <CreateApprovalForm
            engagementId={engagementParam}
            engagementLabel={engagementLabel || engagementParam}
            tasks={tasks}
            reports={reports}
            canSubmit={source === "database"}
          />
        </Panel>
      )}
    </div>
  );
}
