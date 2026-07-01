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
  | "approvals"
  | "organizations";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: AdminNavIcon;
};

export const adminNavItems: AdminNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/revenue", label: "Revenue", icon: "revenue" },
  { href: "/admin/pipeline", label: "Pipeline", icon: "pipeline" },
  { href: "/admin/content", label: "Content", icon: "content" },
  { href: "/admin/emails", label: "Emails", icon: "emails" },
  { href: "/admin/marketing", label: "Marketing", icon: "marketing" },
  { href: "/admin/visibility", label: "AI Visibility", icon: "visibility" },
  { href: "/admin/agents", label: "Agents", icon: "agents" },
  { href: "/admin/organizations", label: "Organizations", icon: "organizations" },
];
