import "server-only";

export type DataSource = "database" | "mock";

export const auditStatusLabel: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  waiting_review: "Waiting Review",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const proposalStatusLabel: Record<string, string> = {
  draft: "Draft",
  internal_review: "Internal review",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  lost: "Lost",
  expired: "Expired",
};

export const sprintStatusLabel: Record<string, string> = {
  planned: "Planned",
  active: "Active",
  completed: "Completed",
};

export const taskStatusLabel: Record<string, string> = {
  todo: "Todo",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
  cancelled: "Cancelled",
};

export const taskPriorityLabel: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const taskApprovalLabel: Record<string, string> = {
  not_required: "Not required",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const reportTypeLabel: Record<string, string> = {
  audit: "Audit",
  weekly: "Weekly",
  executive: "Executive",
  deliverable: "Deliverable",
};

export const reportStatusLabel: Record<string, string> = {
  draft: "Draft",
  internal_review: "Internal review",
  client_ready: "Client ready",
  delivered: "Delivered",
  archived: "Archived",
};

export const approvalRiskLabel: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function mapLabel<T extends Record<string, string>>(map: T, key: string | null | undefined, fallback = "—"): string {
  if (!key) return fallback;
  return map[key] ?? fallback;
}
