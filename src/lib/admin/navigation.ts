export type AdminNavIcon =
  | "dashboard"
  | "users"
  | "revenue"
  | "activity"
  | "leads"
  | "content"
  | "emails"
  | "pipeline"
  | "marketing"
  | "visibility"
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
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/revenue", label: "Revenue", icon: "revenue" },
  { href: "/admin/activity", label: "Activity", icon: "activity" },
  { href: "/admin/leads", label: "Leads", icon: "leads" },
  { href: "/admin/content", label: "Content", icon: "content" },
  { href: "/admin/emails", label: "Emails", icon: "emails" },
  { href: "/admin/pipeline", label: "Pipeline", icon: "pipeline" },
  { href: "/admin/marketing", label: "Marketing", icon: "marketing" },
  { href: "/admin/visibility", label: "AI Visibility", icon: "visibility" },
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
