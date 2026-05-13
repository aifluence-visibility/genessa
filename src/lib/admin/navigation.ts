export type AdminNavIcon =
  | "dashboard"
  | "activity"
  | "leads"
  | "audits"
  | "proposals"
  | "sprints"
  | "clients"
  | "tasks"
  | "agents"
  | "agent_runs"
  | "reports"
  | "approvals";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: AdminNavIcon;
};

export const adminNavItems: AdminNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/activity", label: "Activity", icon: "activity" },
  { href: "/admin/leads", label: "Leads", icon: "leads" },
  { href: "/admin/audits", label: "Audits", icon: "audits" },
  { href: "/admin/proposals", label: "Proposals", icon: "proposals" },
  { href: "/admin/sprints", label: "Sprints", icon: "sprints" },
  { href: "/admin/clients", label: "Active Clients", icon: "clients" },
  { href: "/admin/tasks", label: "Tasks", icon: "tasks" },
  { href: "/admin/agents", label: "Agents", icon: "agents" },
  { href: "/admin/agent-runs", label: "Agent runs", icon: "agent_runs" },
  { href: "/admin/reports", label: "Reports", icon: "reports" },
  { href: "/admin/approvals", label: "Approvals", icon: "approvals" },
];
