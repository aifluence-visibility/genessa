export type SprintStatus = "Planned" | "Active" | "Completed";

export type SprintRow = {
  id: string;
  engagementId: string;
  client: string;
  label: string;
  status: SprintStatus;
  /** Display range e.g. `2026-05-05 → 2026-05-11` */
  period: string;
  goals: string;
  updatedAt: string;
};

export const mockSprints: SprintRow[] = [
  {
    id: "spr-mock-1",
    engagementId: "00000004-0000-4000-8000-000000000001",
    client: "NYU",
    label: "Week 6 · Content authority",
    status: "Active",
    period: "2026-05-05 → 2026-05-11",
    goals: "Faculty templates + EEAT pass",
    updatedAt: "2026-05-12",
  },
  {
    id: "spr-mock-2",
    engagementId: "00000004-0000-4000-8000-000000000002",
    client: "Brightline CRM",
    label: "Week 2 · Technical foundation",
    status: "Planned",
    period: "—",
    goals: "Crawl baseline + llms.txt readiness",
    updatedAt: "2026-05-10",
  },
  {
    id: "spr-mock-3",
    engagementId: "00000004-0000-4000-8000-000000000010",
    client: "Stanford University",
    label: "Entity reconciliation sprint",
    status: "Completed",
    period: "2026-04-01 → 2026-04-14",
    goals: "Wikidata ↔ institutional entity map",
    updatedAt: "2026-04-15",
  },
];
