import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { getAdminOrganizations } from "@/lib/db/admin/organizations";
import { addCreditsAction, removeCreditsAction } from "./actions";

export const metadata: Metadata = { title: "Organizations" };

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function AdminOrganizationsPage() {
  const { source, rows } = await getAdminOrganizations();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Organizations"
        description="V2 orgs — engine prompts, credits, and visibility scores."
        actions={
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--border)] ${
              source === "database" ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"
            }`}
          >
            {source === "database" ? "Live database" : "Supabase not configured"}
          </span>
        }
      />

      {rows.length === 0 ? (
        <Panel>
          <p className="py-8 text-center text-sm text-[var(--ink-500)]">
            {source === "unavailable"
              ? "Configure SUPABASE_SERVICE_ROLE_KEY to load organizations."
              : "No organizations yet. Users complete onboarding to create one."}
          </p>
        </Panel>
      ) : (
        <Panel padding="p-0" className="overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--ink-0)]">
                {["Org / Domain", "User", "Locale", "Prompts", "Runs", "Last scores", "Credits", "Joined", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--ink-500)]"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rows.map((org) => (
                <tr key={org.id} className="hover:bg-[var(--ink-0)] transition-colors">
                  {/* Org name + domain */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--ink-900)]">{org.name}</p>
                    {org.domain && (
                      <p className="mt-0.5 text-xs text-[var(--ink-500)]">{org.domain}</p>
                    )}
                  </td>

                  {/* User email */}
                  <td className="px-4 py-3 text-xs text-[var(--ink-600)]">
                    {org.user_email ?? "—"}
                  </td>

                  {/* Locale */}
                  <td className="px-4 py-3">
                    {org.locale ? (
                      <span className="rounded-full bg-[var(--ink-0)] px-2 py-0.5 text-xs font-mono ring-1 ring-[var(--border)]">
                        {org.locale}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--ink-400)]">—</span>
                    )}
                  </td>

                  {/* Prompt count */}
                  <td className="px-4 py-3 text-center tabular-nums text-[var(--ink-700)]">
                    {org.prompt_count}
                  </td>

                  {/* Completed runs */}
                  <td className="px-4 py-3 text-center tabular-nums text-[var(--ink-700)]">
                    {org.completed_runs}
                  </td>

                  {/* Latest engine scores period */}
                  <td className="px-4 py-3 text-xs text-[var(--ink-600)]">
                    {fmt(org.latest_period)}
                  </td>

                  {/* Credits + controls */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="min-w-[2rem] text-center font-mono text-sm font-semibold text-[var(--ink-900)]">
                        {org.extra_query_credits}
                      </span>
                      <form
                        action={async () => {
                          "use server";
                          await removeCreditsAction(org.id, 1);
                        }}
                      >
                        <button
                          type="submit"
                          className="flex h-6 w-6 items-center justify-center rounded border border-[var(--border)] bg-[var(--ink-0)] text-xs font-bold text-[var(--ink-600)] hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors"
                          title="Remove 1 credit"
                        >
                          −
                        </button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await addCreditsAction(org.id, 1);
                        }}
                      >
                        <button
                          type="submit"
                          className="flex h-6 w-6 items-center justify-center rounded border border-[var(--border)] bg-[var(--ink-0)] text-xs font-bold text-[var(--ink-600)] hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors"
                          title="Add 1 credit"
                        >
                          +
                        </button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await addCreditsAction(org.id, 10);
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded border border-[var(--border)] bg-[var(--ink-0)] px-2 py-0.5 text-xs font-semibold text-[var(--ink-600)] hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors"
                          title="Add 10 credits"
                        >
                          +10
                        </button>
                      </form>
                    </div>
                  </td>

                  {/* Joined date */}
                  <td className="px-4 py-3 text-xs text-[var(--ink-500)]">
                    {fmt(org.created_at)}
                  </td>

                  {/* Org ID (truncated, for debugging) */}
                  <td className="px-4 py-3">
                    <span className="font-mono text-[10px] text-[var(--ink-400)]" title={org.id}>
                      {org.id.slice(0, 8)}…
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
