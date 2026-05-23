export type Plan = "free" | "premium" | "agency";

export const PLAN_LIMITS = {
  free: {
    maxDomains: 1,
    scanIntervalDays: 7,
    aiInsight: true,
    growthAudit: false,
    pdfExport: false,
    checklistFull: false,
    multiDomain: false,
    whiteLabel: false,
  },
  premium: {
    maxDomains: 3,
    scanIntervalDays: 1,
    aiInsight: true,
    growthAudit: true,
    pdfExport: true,
    checklistFull: true,
    multiDomain: false,
    whiteLabel: false,
  },
  agency: {
    maxDomains: 10,
    scanIntervalDays: 1,
    aiInsight: true,
    growthAudit: true,
    pdfExport: true,
    checklistFull: true,
    multiDomain: true,
    whiteLabel: true,
  },
} satisfies Record<Plan, Record<string, boolean | number>>;

export function canAccess(
  plan: Plan,
  feature: keyof typeof PLAN_LIMITS.free
): boolean {
  return !!PLAN_LIMITS[plan]?.[feature];
}

export function getPlanLabel(plan: Plan): string {
  return { free: "Free", premium: "Premium", agency: "Agency" }[plan];
}

export function getPlanColor(plan: Plan): string {
  return {
    free: "#6B7280",
    premium: "#8B5CF6",
    agency: "#F59E0B",
  }[plan];
}
