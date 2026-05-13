export type ReportType = "Audit" | "Weekly" | "Executive" | "Deliverable";

export type ReportStatus =
  | "Draft"
  | "Internal review"
  | "Client ready"
  | "Delivered"
  | "Archived";

export type ReportRow = {
  id: string;
  title: string;
  client: string;
  type: ReportType;
  version: string;
  updatedAt: string;
  status: ReportStatus;
  /** Raw DB enum when loaded from Postgres */
  statusDb?: string;
};

export const mockReports: ReportRow[] = [
  {
    id: "rep-1",
    title: "AI Visibility Audit — Stanford",
    client: "Stanford University",
    type: "Audit",
    version: "v1.3",
    updatedAt: "2026-05-12",
    status: "Internal review",
  },
  {
    id: "rep-2",
    title: "Weekly sprint summary — NYU",
    client: "NYU",
    type: "Weekly",
    version: "W06",
    updatedAt: "2026-05-11",
    status: "Delivered",
  },
  {
    id: "rep-3",
    title: "Executive visibility brief — Q2",
    client: "Helix Analytics",
    type: "Executive",
    version: "v0.9",
    updatedAt: "2026-05-09",
    status: "Draft",
  },
];
