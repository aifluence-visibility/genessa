import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

// Vercel Cron sends Authorization: Bearer <CRON_SECRET>
function isCronAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${cronSecret}`;
}

// Returns the Monday of the ISO week containing the given date
function weekStart(d: Date): Date {
  const day = d.getUTCDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  const now = new Date();
  const periodStart = toDateStr(weekStart(now));
  const periodEnd = toDateStr(now);

  const { data, error } = await admin.rpc("aggregate_all_engine_scores", {
    p_period_start: periodStart,
    p_period_end: periodEnd,
  });

  if (error) {
    console.error("[cron/aggregate-scores]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[cron/aggregate-scores] ${data} row(s) written — ${periodStart} → ${periodEnd}`);
  return NextResponse.json({ ok: true, rows_written: data, period_start: periodStart, period_end: periodEnd });
}
