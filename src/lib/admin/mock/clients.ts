export type ClientRow = {
  /** Engagement spine id (links to `/admin/engagements/...`). */
  engagementId: string;
  id: string;
  name: string;
  domain: string;
  sectorPack: string;
  score: number;
  sprint: string;
  roadmap: string;
};

export const mockClients: ClientRow[] = [
  {
    engagementId: "00000004-0000-4000-8000-000000000001",
    id: "cli-1",
    name: "NYU",
    domain: "nyu.edu",
    sectorPack: "EDU",
    score: 74,
    sprint: "Week 6 · Content authority",
    roadmap: "Phase 3 of 4",
  },
  {
    engagementId: "00000004-0000-4000-8000-000000000002",
    id: "cli-2",
    name: "Brightline CRM",
    domain: "brightlinecrm.com",
    sectorPack: "SaaS",
    score: 69,
    sprint: "Week 2 · Technical foundation",
    roadmap: "Phase 1 of 4",
  },
  {
    engagementId: "00000004-0000-4000-8000-000000000003",
    id: "cli-3",
    name: "Pacific Bistro Group",
    domain: "pacificbistro.com",
    sectorPack: "Restaurant",
    score: 51,
    sprint: "Week 4 · Local entity",
    roadmap: "Phase 2 of 4",
  },
];
