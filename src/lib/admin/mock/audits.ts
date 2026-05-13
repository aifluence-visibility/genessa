export type AuditStatus = "Pending" | "In Progress" | "Waiting Review" | "Completed";

export type AuditRow = {
  id: string;
  domain: string;
  sector: string;
  status: AuditStatus;
  owner: string;
  updatedAt: string;
};

export const mockAudits: AuditRow[] = [
  {
    id: "aud-1",
    domain: "stanford.edu",
    sector: "EDU",
    status: "Waiting Review",
    owner: "A. Okonkwo",
    updatedAt: "2026-05-12",
  },
  {
    id: "aud-2",
    domain: "mit.edu",
    sector: "EDU",
    status: "In Progress",
    owner: "L. Matsumoto",
    updatedAt: "2026-05-11",
  },
  {
    id: "aud-3",
    domain: "nyu.edu",
    sector: "EDU",
    status: "Completed",
    owner: "A. Okonkwo",
    updatedAt: "2026-05-09",
  },
  {
    id: "aud-4",
    domain: "app.acmehealth.com",
    sector: "SaaS",
    status: "Pending",
    owner: "Unassigned",
    updatedAt: "2026-05-08",
  },
];
