export type ProposalStatus = "Draft" | "Internal review" | "Sent" | "Accepted" | "Lost";

export type ProposalRow = {
  id: string;
  client: string;
  duration: string;
  targetScore: number;
  pricing: string;
  status: ProposalStatus;
  updatedAt: string;
};

export const mockProposals: ProposalRow[] = [
  {
    id: "prop-1",
    client: "University of Oregon",
    duration: "12 months",
    targetScore: 82,
    pricing: "$48k / yr",
    status: "Internal review",
    updatedAt: "2026-05-12",
  },
  {
    id: "prop-2",
    client: "Helix Analytics",
    duration: "6 months",
    targetScore: 76,
    pricing: "$18k",
    status: "Sent",
    updatedAt: "2026-05-10",
  },
  {
    id: "prop-3",
    client: "Metro Hospitality Group",
    duration: "3 months",
    targetScore: 64,
    pricing: "$9.5k",
    status: "Draft",
    updatedAt: "2026-05-07",
  },
];
