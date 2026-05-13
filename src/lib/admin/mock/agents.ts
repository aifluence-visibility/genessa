import type { TaskRow } from "@/lib/admin/mock/tasks";
import { mockTasks } from "@/lib/admin/mock/tasks";

export type AgentRow = {
  id: string;
  name: string;
  /** True when workload is keyed on `assignee_user_id` (internal user). */
  linkedUser: boolean;
  active: number;
  done: number;
  cancelled: number;
  total: number;
  recentTitle: string;
  updatedAt: string;
};

/** Derive agent rollup from mock tasks (label-only assignees). */
export function mockAgentRollupFromTasks(): AgentRow[] {
  return aggregateTasks(
    mockTasks.map((t) => ({
      assignee_label: t.assignedAgent === "Unassigned" ? null : t.assignedAgent,
      assignee_user_id: null as string | null,
      status: t.statusDb ?? mapDisplayStatusToDb(t.status),
      title: t.title,
      updated_at: "2026-05-12T12:00:00Z",
      user_display: null as string | null,
    })),
  );
}

function mapDisplayStatusToDb(s: TaskRow["status"]): string {
  switch (s) {
    case "Todo":
      return "todo";
    case "In progress":
      return "in_progress";
    case "Blocked":
      return "blocked";
    case "Done":
      return "done";
    case "Cancelled":
      return "cancelled";
    default:
      return "todo";
  }
}

type AggTask = {
  assignee_label: string | null;
  assignee_user_id: string | null;
  status: string;
  title: string;
  updated_at: string;
  user_display: string | null;
};

function agentKey(t: AggTask): string {
  if (t.assignee_user_id) {
    return `u:${t.assignee_user_id}`;
  }
  const lab = t.assignee_label?.trim();
  if (lab) {
    return `l:${lab.toLowerCase()}`;
  }
  return "unassigned";
}

function agentName(t: AggTask): string {
  if (t.assignee_user_id && t.user_display?.trim()) {
    return t.user_display.trim();
  }
  const lab = t.assignee_label?.trim();
  if (lab) {
    return lab;
  }
  return "Unassigned";
}

export function aggregateTasks(rows: AggTask[]): AgentRow[] {
  const buckets = new Map<
    string,
    {
      name: string;
      linkedUser: boolean;
      todo: number;
      in_progress: number;
      blocked: number;
      done: number;
      cancelled: number;
      lastTs: number;
      recentTitle: string;
    }
  >();

  for (const t of rows) {
    const key = agentKey(t);
    const name = agentName(t);
    const linkedUser = Boolean(t.assignee_user_id);
    let b = buckets.get(key);
    if (!b) {
      b = {
        name,
        linkedUser,
        todo: 0,
        in_progress: 0,
        blocked: 0,
        done: 0,
        cancelled: 0,
        lastTs: 0,
        recentTitle: t.title,
      };
      buckets.set(key, b);
    }

    switch (t.status) {
      case "todo":
        b.todo += 1;
        break;
      case "in_progress":
        b.in_progress += 1;
        break;
      case "blocked":
        b.blocked += 1;
        break;
      case "done":
        b.done += 1;
        break;
      case "cancelled":
        b.cancelled += 1;
        break;
      default:
        b.todo += 1;
    }

    b.linkedUser = b.linkedUser || linkedUser;

    const ts = new Date(t.updated_at).getTime();
    if (!Number.isNaN(ts) && ts >= b.lastTs) {
      b.lastTs = ts;
      b.recentTitle = t.title;
    }
  }

  const list: AgentRow[] = [...buckets.entries()].map(([id, b]) => {
    const active = b.todo + b.in_progress + b.blocked;
    const total = active + b.done + b.cancelled;
    return {
      id,
      name: b.name,
      linkedUser: b.linkedUser,
      active,
      done: b.done,
      cancelled: b.cancelled,
      total,
      recentTitle: b.recentTitle,
      updatedAt: b.lastTs ? new Date(b.lastTs).toISOString().slice(0, 10) : "—",
    };
  });

  list.sort((a, b) => {
    if (b.active !== a.active) return b.active - a.active;
    return a.name.localeCompare(b.name);
  });

  return list;
}
