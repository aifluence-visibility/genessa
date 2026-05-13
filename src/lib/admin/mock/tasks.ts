export type TaskStatus = "Todo" | "In progress" | "Blocked" | "Done" | "Cancelled";
export type TaskPriority = "Low" | "Medium" | "High";
export type ApprovalState = "Not required" | "Pending" | "Approved" | "Rejected";

export type TaskRow = {
  id: string;
  title: string;
  taskType: string;
  sector: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedAgent: string;
  output: string;
  approval: ApprovalState;
  /** Raw DB values when row is loaded from Postgres (for admin mutations). */
  statusDb?: string;
  approvalDb?: string;
  /** Mock / offline detail: links when Supabase admin client is unset. */
  mockEngagementId?: string;
  mockClientName?: string;
};

export const mockTasks: TaskRow[] = [
  {
    id: "tsk-1",
    title: "CollegeOrUniversity schema gap analysis",
    taskType: "Schema audit",
    sector: "EDU",
    priority: "High",
    status: "In progress",
    assignedAgent: "EDU Schema Agent",
    output: "Draft findings v2",
    approval: "Pending",
    mockEngagementId: "00000004-0000-4000-8000-000000000011",
    mockClientName: "MIT",
  },
  {
    id: "tsk-2",
    title: "Faculty directory EEAT review",
    taskType: "Content authority",
    sector: "EDU",
    priority: "Medium",
    status: "Todo",
    assignedAgent: "EDU Content Authority Agent",
    output: "—",
    approval: "Not required",
    mockEngagementId: "00000004-0000-4000-8000-000000000011",
    mockClientName: "MIT",
  },
  {
    id: "tsk-3",
    title: "Wikidata ↔ site entity reconciliation",
    taskType: "Entity authority",
    sector: "EDU",
    priority: "High",
    status: "Blocked",
    assignedAgent: "EDU Entity Agent",
    output: "Awaiting client token",
    approval: "Not required",
    mockEngagementId: "00000004-0000-4000-8000-000000000010",
    mockClientName: "Stanford University",
  },
  {
    id: "tsk-4",
    title: "llms.txt + robots crawl verification",
    taskType: "Technical foundation",
    sector: "SaaS",
    priority: "Low",
    status: "Done",
    assignedAgent: "Manual runbook",
    output: "Signed-off crawl pack",
    approval: "Approved",
    mockEngagementId: "00000004-0000-4000-8000-000000000002",
    mockClientName: "Brightline CRM",
  },
];
