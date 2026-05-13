export type AgentRunStatusUi = "Pending" | "Running" | "Succeeded" | "Failed" | "Cancelled";

export type AgentRunListRow = {
  id: string;
  taskId: string;
  engagementId: string;
  client: string;
  taskTitle: string;
  taskType: string;
  status: AgentRunStatusUi;
  statusDb: string;
  runKeyShort: string;
  errorSnippet: string | null;
  createdAt: string;
  startedAt: string;
  finishedAt: string;
  wallDuration: string;
  metricsSummary: string;
};

function statusUi(db: string): { ui: AgentRunStatusUi; db: string } {
  const s = db.toLowerCase();
  const map: Record<string, AgentRunStatusUi> = {
    pending: "Pending",
    running: "Running",
    succeeded: "Succeeded",
    failed: "Failed",
    cancelled: "Cancelled",
  };
  return { ui: map[s] ?? "Pending", db: s };
}

export const mockAgentRuns: AgentRunListRow[] = [
  (() => {
    const st = statusUi("succeeded");
    return {
      id: "0000000c-0000-4000-8000-000000000001",
      taskId: "00000009-0000-4000-8000-000000000001",
      engagementId: "00000004-0000-4000-8000-000000000011",
      client: "MIT",
      taskTitle: "CollegeOrUniversity schema gap analysis",
      taskType: "Schema audit",
      status: st.ui,
      statusDb: st.db,
      runKeyShort: "…000001:admin-ui-demo",
      errorSnippet: null,
      createdAt: "2026-05-13 10:15",
      startedAt: "2026-05-13 10:16",
      finishedAt: "2026-05-13 10:17",
      wallDuration: "1.0m",
      metricsSummary: "fetch 1.2s · LLM 3.4s · 612 tok",
    };
  })(),
  (() => {
    const st = statusUi("pending");
    return {
      id: "0000000c-0000-4000-8000-000000000002",
      taskId: "00000009-0000-4000-8000-000000000002",
      engagementId: "00000004-0000-4000-8000-000000000011",
      client: "MIT",
      taskTitle: "Faculty directory EEAT review",
      taskType: "Content authority",
      status: st.ui,
      statusDb: st.db,
      runKeyShort: "…000002:default",
      errorSnippet: null,
      createdAt: "2026-05-13 11:00",
      startedAt: "—",
      finishedAt: "—",
      wallDuration: "—",
      metricsSummary: "—",
    };
  })(),
];
