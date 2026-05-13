export type LeadRow = {
  id: string;
  domain: string;
  sector: string;
  email: string;
  score: number;
  createdAt: string;
  auditRequested: boolean;
};

export const mockLeads: LeadRow[] = [
  {
    id: "lead-1",
    domain: "riverside.edu",
    sector: "EDU",
    email: "m.chen@riverside.edu",
    score: 58,
    createdAt: "2026-05-12",
    auditRequested: true,
  },
  {
    id: "lead-2",
    domain: "brighton-restaurants.com",
    sector: "Restaurant",
    email: "ops@brighton-restaurants.com",
    score: 42,
    createdAt: "2026-05-11",
    auditRequested: false,
  },
  {
    id: "lead-3",
    domain: "northernlabs.io",
    sector: "SaaS",
    email: "hello@northernlabs.io",
    score: 67,
    createdAt: "2026-05-10",
    auditRequested: true,
  },
];
