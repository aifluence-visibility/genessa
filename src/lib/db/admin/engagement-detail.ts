import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { humanizeDbEnum, toDisplaySector } from "@/lib/db/admin/format";
import type { DataSource } from "@/lib/db/admin/labels";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AdminEngagementDetail = {
  id: string;
  clientAccountId: string;
  clientName: string;
  domain: string;
  visibilityScore: number;
  kind: string;
  status: string;
  sectorPack: string;
  startedOn: string | null;
  endedOn: string | null;
  roadmapPhase: string | null;
  currentSprint: string | null;
  metadata: Record<string, unknown>;
  deletedAt: string | null;
  sprintProgressPct: number | null;
  sprintProgressHint: string | null;
  counts: {
    tasks: number;
    reports: number;
    openApprovals: number;
    audits: number;
    proposals: number;
    sprints: number;
  };
};

export type EngagementDetailResult =
  | { source: DataSource; detail: AdminEngagementDetail }
  | { source: "not_found" };

function uiMeta(metadata: unknown): { pct: number | null; hint: string | null } {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return { pct: null, hint: null };
  }
  const root = metadata as Record<string, unknown>;
  const ui = root.ui;
  if (!ui || typeof ui !== "object" || Array.isArray(ui)) {
    return { pct: null, hint: null };
  }
  const u = ui as Record<string, unknown>;
  const rawPct = u.sprint_progress_pct;
  const pct = typeof rawPct === "number" && Number.isFinite(rawPct) ? Math.round(rawPct) : null;
  const hint = typeof u.sprint_progress_hint === "string" ? u.sprint_progress_hint : null;
  return { pct, hint };
}

const mockEngagementDetails: Record<string, AdminEngagementDetail> = {
  "00000004-0000-4000-8000-000000000001": {
    id: "00000004-0000-4000-8000-000000000001",
    clientAccountId: "00000003-0000-4000-8000-000000000001",
    clientName: "NYU",
    domain: "nyu.edu",
    visibilityScore: 74,
    kind: "Delivery",
    status: "Active",
    sectorPack: "EDU",
    startedOn: null,
    endedOn: null,
    roadmapPhase: "Phase 3 of 4",
    currentSprint: "Week 6 · Content authority",
    metadata: { ui: { sprint_progress_pct: 68, sprint_progress_hint: "Week 6 of 12" } },
    deletedAt: null,
    sprintProgressPct: 68,
    sprintProgressHint: "Week 6 of 12",
    counts: { tasks: 0, reports: 1, openApprovals: 0, audits: 1, proposals: 0, sprints: 1 },
  },
  "00000004-0000-4000-8000-000000000002": {
    id: "00000004-0000-4000-8000-000000000002",
    clientAccountId: "00000003-0000-4000-8000-000000000002",
    clientName: "Brightline CRM",
    domain: "brightlinecrm.com",
    visibilityScore: 69,
    kind: "Delivery",
    status: "Active",
    sectorPack: "SaaS",
    startedOn: null,
    endedOn: null,
    roadmapPhase: "Phase 1 of 4",
    currentSprint: "Week 2 · Technical foundation",
    metadata: { ui: { sprint_progress_pct: 24, sprint_progress_hint: "Week 2 of 8" } },
    deletedAt: null,
    sprintProgressPct: 24,
    sprintProgressHint: "Week 2 of 8",
    counts: { tasks: 1, reports: 1, openApprovals: 0, audits: 0, proposals: 0, sprints: 0 },
  },
  "00000004-0000-4000-8000-000000000003": {
    id: "00000004-0000-4000-8000-000000000003",
    clientAccountId: "00000003-0000-4000-8000-000000000003",
    clientName: "Pacific Bistro Group",
    domain: "pacificbistro.com",
    visibilityScore: 51,
    kind: "Delivery",
    status: "Active",
    sectorPack: "Restaurant",
    startedOn: null,
    endedOn: null,
    roadmapPhase: "Phase 2 of 4",
    currentSprint: "Week 4 · Local entity",
    metadata: { ui: { sprint_progress_pct: 42, sprint_progress_hint: "Week 4 of 10" } },
    deletedAt: null,
    sprintProgressPct: 42,
    sprintProgressHint: "Week 4 of 10",
    counts: { tasks: 0, reports: 0, openApprovals: 0, audits: 0, proposals: 0, sprints: 0 },
  },
};

export async function getAdminEngagementDetail(rawId: string): Promise<EngagementDetailResult> {
  const id = rawId?.trim() ?? "";
  if (!uuidRe.test(id)) {
    return { source: "not_found" };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    const detail = mockEngagementDetails[id];
    return detail ? { source: "mock", detail } : { source: "not_found" };
  }

  const { data: eng, error } = await supabase
    .from("engagements")
    .select(
      `
      id,
      client_account_id,
      kind,
      status,
      sector_pack_key,
      started_on,
      ended_on,
      roadmap_phase_label,
      current_sprint_label,
      metadata,
      deleted_at,
      client_accounts!inner (
        id,
        name,
        primary_domain,
        current_visibility_score
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin] engagement detail failed", error);
    return { source: "not_found" };
  }
  if (!eng) {
    return { source: "not_found" };
  }

  const client = eng.client_accounts as unknown as {
    id: string;
    name: string;
    primary_domain: string | null;
    current_visibility_score: number | null;
  };

  const [tasksRes, reportsRes, approvalsRes, auditsRes, proposalsRes, sprintsRes] = await Promise.all([
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("engagement_id", id),
    supabase.from("report_artifacts").select("id", { count: "exact", head: true }).eq("engagement_id", id),
    supabase.from("approval_requests").select("id", { count: "exact", head: true }).eq("engagement_id", id).eq("status", "open"),
    supabase.from("audits").select("id", { count: "exact", head: true }).eq("engagement_id", id),
    supabase.from("proposals").select("id", { count: "exact", head: true }).eq("engagement_id", id),
    supabase.from("sprints").select("id", { count: "exact", head: true }).eq("engagement_id", id),
  ]);

  const meta = eng.metadata as unknown;
  const { pct, hint } = uiMeta(meta);

  const detail: AdminEngagementDetail = {
    id: eng.id as string,
    clientAccountId: client.id,
    clientName: client.name,
    domain: client.primary_domain ?? "—",
    visibilityScore: typeof client.current_visibility_score === "number" ? client.current_visibility_score : 0,
    kind: humanizeDbEnum(eng.kind as string),
    status: humanizeDbEnum(eng.status as string),
    sectorPack: toDisplaySector(eng.sector_pack_key as string | null),
    startedOn: (eng.started_on as string | null) ?? null,
    endedOn: (eng.ended_on as string | null) ?? null,
    roadmapPhase: (eng.roadmap_phase_label as string | null) ?? null,
    currentSprint: (eng.current_sprint_label as string | null) ?? null,
    metadata: meta && typeof meta === "object" && !Array.isArray(meta) ? (meta as Record<string, unknown>) : {},
    deletedAt: (eng.deleted_at as string | null) ?? null,
    sprintProgressPct: pct,
    sprintProgressHint: hint,
    counts: {
      tasks: tasksRes.count ?? 0,
      reports: reportsRes.count ?? 0,
      openApprovals: approvalsRes.count ?? 0,
      audits: auditsRes.count ?? 0,
      proposals: proposalsRes.count ?? 0,
      sprints: sprintsRes.count ?? 0,
    },
  };

  return { source: "database", detail };
}
