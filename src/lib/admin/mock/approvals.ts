export type ApprovalRow = {
  id: string;
  title: string;
  client: string;
  artifact: string;
  owner: string;
  submittedAt: string;
  risk: "Low" | "Medium" | "High";
};

export const mockApprovals: ApprovalRow[] = [
  {
    id: "apr-1",
    title: "Schema remediation JSON-LD bundle",
    client: "MIT",
    artifact: "jsonld_bundle_v4.json",
    owner: "EDU Schema Agent",
    submittedAt: "2026-05-12T10:22:00Z",
    risk: "Medium",
  },
  {
    id: "apr-2",
    title: "Citation narrative — AI Overviews",
    client: "University of Oregon",
    artifact: "narrative_draft.md",
    owner: "Consulting · A. Okonkwo",
    submittedAt: "2026-05-12T08:05:00Z",
    risk: "High",
  },
  {
    id: "apr-3",
    title: "Technical findings appendix",
    client: "Brightline CRM",
    artifact: "appendix_technical.pdf",
    owner: "Manual review",
    submittedAt: "2026-05-11T16:40:00Z",
    risk: "Low",
  },
];
