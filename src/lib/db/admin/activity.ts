import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { formatRelativeTime, toDisplayDate } from "@/lib/db/admin/format";
import type { DataSource } from "@/lib/db/admin/labels";
import type { ActivityItem } from "@/lib/admin/mock/dashboard";

const PAGE_SIZE = 35;
const EVENT_TYPES = new Set<ActivityItem["type"]>(["audit", "approval", "lead", "task", "engagement", "report"]);

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ActivityTimelineRow = {
  id: string;
  eventType: ActivityItem["type"];
  title: string;
  detail: string;
  actorLabel: string | null;
  createdAtIso: string;
  timeRelative: string;
  dateAbsolute: string;
  engagementId: string | null;
  clientName: string | null;
  /** Derived from payload for approval events */
  approvalAction: "open" | "approve" | "reject" | "rerun" | null;
  /** Short lineage / context (e.g. rerun follow-up id, task delta) */
  payloadHint: string | null;
  /** Derived from payload for task transition events */
  taskChange: "status" | "approval_state" | null;
  /** Derived from payload for report artifact status changes */
  reportChange: "status" | null;
};

export type AdminEngagementFilterOption = {
  id: string;
  label: string;
};

function normalizeEventType(raw: string): ActivityItem["type"] {
  return EVENT_TYPES.has(raw as ActivityItem["type"]) ? (raw as ActivityItem["type"]) : "task";
}

function parseApprovalPayload(payload: unknown): {
  approvalAction: ActivityTimelineRow["approvalAction"];
  payloadHint: string | null;
} {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { approvalAction: null, payloadHint: null };
  }
  const p = payload as Record<string, unknown>;
  const rawAction = p.action;
  const approvalAction =
    rawAction === "open" ||
    rawAction === "approve" ||
    rawAction === "reject" ||
    rawAction === "rerun"
      ? rawAction
      : null;

  let payloadHint: string | null = null;
  if (approvalAction === "rerun" && typeof p.follow_up_approval_id === "string" && uuidRe.test(p.follow_up_approval_id)) {
    const short = p.follow_up_approval_id.replace(/-/g, "").slice(0, 10);
    payloadHint = `Follow-up approval …${short}`;
  } else if (typeof p.approval_id === "string" && uuidRe.test(p.approval_id) && approvalAction) {
    const short = p.approval_id.replace(/-/g, "").slice(0, 10);
    payloadHint = `Approval …${short}`;
  }

  return { approvalAction, payloadHint };
}

function parseTaskTransitionPayload(payload: unknown): {
  approvalAction: null;
  payloadHint: string | null;
  taskChange: ActivityTimelineRow["taskChange"];
  reportChange: null;
} {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { approvalAction: null, payloadHint: null, taskChange: null, reportChange: null };
  }
  const p = payload as Record<string, unknown>;
  const change = p.change;
  const from = p.from;
  const to = p.to;

  if (
    change === "status" &&
    typeof from === "string" &&
    typeof to === "string" &&
    typeof p.task_id === "string"
  ) {
    return {
      approvalAction: null,
      payloadHint: `Status: ${from} → ${to}`,
      taskChange: "status",
      reportChange: null,
    };
  }

  if (
    change === "approval_state" &&
    typeof from === "string" &&
    typeof to === "string" &&
    typeof p.task_id === "string"
  ) {
    return {
      approvalAction: null,
      payloadHint: `Approval state: ${from} → ${to}`,
      taskChange: "approval_state",
      reportChange: null,
    };
  }

  return { approvalAction: null, payloadHint: null, taskChange: null, reportChange: null };
}

function parseReportStatusPayload(payload: unknown): {
  approvalAction: null;
  payloadHint: string | null;
  taskChange: null;
  reportChange: ActivityTimelineRow["reportChange"];
} {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { approvalAction: null, payloadHint: null, taskChange: null, reportChange: null };
  }
  const p = payload as Record<string, unknown>;
  if (
    p.change === "status" &&
    typeof p.from === "string" &&
    typeof p.to === "string" &&
    typeof p.report_id === "string"
  ) {
    return {
      approvalAction: null,
      payloadHint: `Status: ${p.from} → ${p.to}`,
      taskChange: null,
      reportChange: "status",
    };
  }
  return { approvalAction: null, payloadHint: null, taskChange: null, reportChange: null };
}

function summarizePayloadMeta(eventType: string, payload: unknown): {
  approvalAction: ActivityTimelineRow["approvalAction"];
  payloadHint: string | null;
  taskChange: ActivityTimelineRow["taskChange"];
  reportChange: ActivityTimelineRow["reportChange"];
} {
  if (eventType === "approval") {
    const a = parseApprovalPayload(payload);
    return { ...a, taskChange: null, reportChange: null };
  }
  if (eventType === "task") {
    return parseTaskTransitionPayload(payload);
  }
  if (eventType === "report") {
    return parseReportStatusPayload(payload);
  }
  return { approvalAction: null, payloadHint: null, taskChange: null, reportChange: null };
}

export async function getAdminEngagementFilterOptions(): Promise<{
  source: DataSource;
  options: AdminEngagementFilterOption[];
}> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { source: "mock", options: [] };
  }

  const { data, error } = await supabase
    .from("engagements")
    .select(
      `
      id,
      roadmap_phase_label,
      client_accounts!inner ( name )
    `,
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) {
    console.error("[admin] engagement filter options failed", error);
    return { source: "mock", options: [] };
  }

  const options: AdminEngagementFilterOption[] = (data ?? []).map((row) => {
    const ca = row.client_accounts as unknown as { name: string };
    const name = ca?.name ?? "—";
    const phase = row.roadmap_phase_label ? ` · ${row.roadmap_phase_label}` : "";
    return { id: row.id, label: `${name}${phase}` };
  });

  return { source: "database", options };
}

export type GetAdminActivityParams = {
  engagementId?: string | null;
  eventType?: string | null;
  page?: number;
};

export async function getAdminActivity(
  params: GetAdminActivityParams = {},
): Promise<{
  source: DataSource;
  rows: ActivityTimelineRow[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}> {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const engagementFilter =
    params.engagementId && uuidRe.test(params.engagementId.trim()) ? params.engagementId.trim() : null;
  const typeFilter =
    params.eventType && EVENT_TYPES.has(params.eventType as ActivityItem["type"])
      ? (params.eventType as ActivityItem["type"])
      : null;

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    const { recentActivity } = await import("@/lib/admin/mock/dashboard");
    let list = [...recentActivity];
    if (typeFilter) {
      list = list.filter((e) => e.type === typeFilter);
    }
    if (engagementFilter) {
      list = [];
    }
    const start = (page - 1) * PAGE_SIZE;
    const slice = list.slice(start, start + PAGE_SIZE);
    const rows: ActivityTimelineRow[] = slice.map((ev) => ({
      id: ev.id,
      eventType: ev.type,
      title: ev.title,
      detail: ev.detail,
      actorLabel: null,
      createdAtIso: new Date().toISOString(),
      timeRelative: ev.time,
      dateAbsolute: "—",
      engagementId: null,
      clientName: null,
      approvalAction: null,
      payloadHint: null,
      taskChange: null,
      reportChange: null,
    }));
    return {
      source: "mock",
      rows,
      page,
      pageSize: PAGE_SIZE,
      hasMore: start + PAGE_SIZE < list.length,
    };
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = supabase
    .from("activity_events")
    .select(
      `
      id,
      event_type,
      title,
      detail,
      actor_label,
      created_at,
      payload,
      engagement_id,
      engagements (
        client_accounts ( name )
      )
    `,
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (engagementFilter) {
    q = q.eq("engagement_id", engagementFilter);
  }

  if (typeFilter) {
    q = q.eq("event_type", typeFilter);
  }

  const { data, error } = await q;

  if (error) {
    console.error("[admin] activity timeline query failed", error);
    const { recentActivity } = await import("@/lib/admin/mock/dashboard");
    let list = [...recentActivity];
    if (typeFilter) {
      list = list.filter((e) => e.type === typeFilter);
    }
    if (engagementFilter) {
      list = [];
    }
    const start = (page - 1) * PAGE_SIZE;
    const slice = list.slice(start, start + PAGE_SIZE);
    return {
      source: "mock",
      rows: slice.map((ev) => ({
        id: ev.id,
        eventType: ev.type,
        title: ev.title,
        detail: ev.detail,
        actorLabel: null,
        createdAtIso: new Date().toISOString(),
        timeRelative: ev.time,
        dateAbsolute: "—",
        engagementId: null,
        clientName: null,
        approvalAction: null,
        payloadHint: null,
        taskChange: null,
        reportChange: null,
      })),
      page,
      pageSize: PAGE_SIZE,
      hasMore: start + PAGE_SIZE < list.length,
    };
  }

  const rows: ActivityTimelineRow[] = (data ?? []).map((row) => {
    const eng = row.engagements as unknown as { client_accounts: { name: string } | null } | null;
    const clientName = eng?.client_accounts?.name ?? null;
    const createdAt = row.created_at as string;
    const { approvalAction, payloadHint, taskChange, reportChange } = summarizePayloadMeta(row.event_type, row.payload);

    return {
      id: row.id,
      eventType: normalizeEventType(row.event_type),
      title: row.title,
      detail: row.detail ?? "",
      actorLabel: row.actor_label ?? null,
      createdAtIso: createdAt,
      timeRelative: formatRelativeTime(createdAt),
      dateAbsolute: toDisplayDate(createdAt),
      engagementId: (row.engagement_id as string | null) ?? null,
      clientName,
      approvalAction,
      payloadHint,
      taskChange,
      reportChange,
    };
  });

  return {
    source: "database",
    rows,
    page,
    pageSize: PAGE_SIZE,
    hasMore: rows.length === PAGE_SIZE,
  };
}
