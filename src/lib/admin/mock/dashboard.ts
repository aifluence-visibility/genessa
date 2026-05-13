export type DashboardStat = { label: string; value: string; hint?: string };

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  type: "audit" | "approval" | "lead" | "task" | "engagement" | "report";
};

export const dashboardStats: DashboardStat[] = [
  { label: "Active clients", value: "14", hint: "+2 this month" },
  { label: "Pending approvals", value: "6", hint: "3 high priority" },
  { label: "Active audits", value: "5", hint: "2 waiting review" },
  { label: "Running tasks", value: "11", hint: "Across 4 clients" },
  { label: "Sprint progress", value: "68%", hint: "Week 6 of 12" },
  { label: "Avg. AI visibility", value: "71", hint: "Rolling 30-day" },
  { label: "Agent queue", value: "1", hint: "1 running now" },
  { label: "Agent runs · 24h", value: "8", hint: "Succeeded / failed / cancelled" },
];

export const recentActivity: ActivityItem[] = [
  {
    id: "act-1",
    title: "Audit marked waiting review",
    detail: "stanford.edu · EDU technical pass",
    time: "12m ago",
    type: "audit",
  },
  {
    id: "act-2",
    title: "Approval requested",
    detail: "Schema remediation brief · MIT",
    time: "26m ago",
    type: "approval",
  },
  {
    id: "act-3",
    title: "New detailed audit request",
    detail: "communitycollege.example · EDU",
    time: "1h ago",
    type: "lead",
  },
  {
    id: "act-4",
    title: "Task completed",
    detail: "Entity map refresh · NYU",
    time: "2h ago",
    type: "task",
  },
  {
    id: "act-5",
    title: "Weekly sprint check-in",
    detail: "4 clients · goals on track",
    time: "4h ago",
    type: "task",
  },
];
