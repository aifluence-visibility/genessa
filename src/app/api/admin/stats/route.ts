import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

export async function GET(req: Request) {
  if (req.headers.get("x-admin-secret") !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Admin client not configured" }, { status: 500 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [scansResult, profilesResult] = await Promise.all([
    admin.from("scans").select("created_at").gte("created_at", thirtyDaysAgo),
    admin.from("profiles").select("plan"),
  ]);

  const scansByDate: Record<string, number> = {};
  for (const row of (scansResult.data ?? []) as { created_at: string }[]) {
    const date = row.created_at.slice(0, 10);
    scansByDate[date] = (scansByDate[date] ?? 0) + 1;
  }

  const scanStats = Object.entries(scansByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);

  const planDist: Record<string, number> = { free: 0, starter: 0, pro: 0, agency: 0, consulting: 0 };
  for (const row of (profilesResult.data ?? []) as { plan: string }[]) {
    const plan = row.plan ?? "free";
    planDist[plan] = (planDist[plan] ?? 0) + 1;
  }

  return NextResponse.json({ scanStats, planDist });
}
