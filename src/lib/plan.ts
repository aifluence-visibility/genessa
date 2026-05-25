export type Plan = "free" | "starter" | "pro" | "agency" | "consulting";

export const PLAN_LIMITS = {
  free: {
    maxDomains: 1,
    scansPerMonth: 1,
    scansPerWeek: 0,
    unlimitedScans: false,
    aiInsight: true,
    insightBlocks: 2,
    fullInsight: false,
    scanHistory: false,
    growthAudit: false,
    pdfExport: false,
    checklistFull: false,
    multiDomain: false,
    whiteLabel: false,
  },
  starter: {
    maxDomains: 1,
    scansPerMonth: 8,
    scansPerWeek: 2,
    unlimitedScans: false,
    aiInsight: true,
    insightBlocks: 6,
    fullInsight: true,
    scanHistory: true,
    growthAudit: false,
    pdfExport: false,
    checklistFull: true,
    multiDomain: false,
    whiteLabel: false,
  },
  pro: {
    maxDomains: 1,
    scansPerMonth: 16,
    scansPerWeek: 4,
    unlimitedScans: false,
    aiInsight: true,
    insightBlocks: 6,
    fullInsight: true,
    scanHistory: true,
    growthAudit: true,
    pdfExport: true,
    checklistFull: true,
    multiDomain: false,
    whiteLabel: false,
  },
  agency: {
    maxDomains: 10,
    scansPerMonth: 999,
    scansPerWeek: 999,
    unlimitedScans: true,
    aiInsight: true,
    insightBlocks: 6,
    fullInsight: true,
    scanHistory: true,
    growthAudit: true,
    pdfExport: true,
    checklistFull: true,
    multiDomain: true,
    whiteLabel: true,
  },
  consulting: {
    maxDomains: 999,
    scansPerMonth: 999,
    scansPerWeek: 999,
    unlimitedScans: true,
    aiInsight: true,
    insightBlocks: 6,
    fullInsight: true,
    scanHistory: true,
    growthAudit: true,
    pdfExport: true,
    checklistFull: true,
    multiDomain: true,
    whiteLabel: true,
  },
} satisfies Record<Plan, Record<string, boolean | number>>;

export const PLAN_PRICES = {
  free:       { monthly: 0,    yearly: 0    },
  starter:    { monthly: 29,   yearly: 23   },
  pro:        { monthly: 79,   yearly: 63   },
  agency:     { monthly: null, yearly: null },
  consulting: { monthly: null, yearly: null },
};

export const PLAN_LABELS: Record<Plan, string> = {
  free:       "Free",
  starter:    "Starter",
  pro:        "Pro",
  agency:     "Agency",
  consulting: "Consulting",
};

export const PLAN_COLORS: Record<Plan, string> = {
  free:       "#6B7280",
  starter:    "#3B82F6",
  pro:        "#8B5CF6",
  agency:     "#F59E0B",
  consulting: "#10B981",
};

export function canAccess(
  plan: Plan,
  feature: keyof typeof PLAN_LIMITS.free
): boolean {
  return !!PLAN_LIMITS[plan]?.[feature];
}

export function getPlanLabel(plan: Plan): string {
  return PLAN_LABELS[plan];
}

export function getPlanColor(plan: Plan): string {
  return PLAN_COLORS[plan];
}

const VALID_PLANS: Plan[] = ["free", "starter", "pro", "agency", "consulting"];

export function normalizePlan(raw: string | null | undefined): Plan {
  if (raw && (VALID_PLANS as string[]).includes(raw)) return raw as Plan;
  return "free";
}
