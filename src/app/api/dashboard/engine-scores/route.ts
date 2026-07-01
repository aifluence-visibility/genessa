import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

export interface EngineScoreRow {
  engine: string;
  target_locale: string;
  period_start: string;
  period_end: string;
  citation_rate: number | null;
  share_of_voice: number | null;
  source_attribution_rate: number | null;
  sentiment_positive_pct: number | null;
  sentiment_neutral_pct: number | null;
  sentiment_negative_pct: number | null;
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.organization_id) {
    return NextResponse.json({ organization_id: null, extra_query_credits: 0, scores: [] });
  }

  const orgId = profile.organization_id as string;

  const [scoresRes, orgRes] = await Promise.all([
    admin
      .from("engine_scores")
      .select(
        "engine, target_locale, period_start, period_end, citation_rate, share_of_voice, source_attribution_rate, sentiment_positive_pct, sentiment_neutral_pct, sentiment_negative_pct"
      )
      .eq("organization_id", orgId)
      .order("period_start", { ascending: false })
      .limit(120),
    admin
      .from("organizations")
      .select("extra_query_credits")
      .eq("id", orgId)
      .maybeSingle(),
  ]);

  if (scoresRes.error) {
    return NextResponse.json({ error: scoresRes.error.message }, { status: 500 });
  }

  const allRows = (scoresRes.data ?? []) as EngineScoreRow[];
  const extraCredits = (orgRes.data?.extra_query_credits as number) ?? 0;

  // ?history=true → return all periods; default → latest per (engine, locale)
  const wantsHistory = req.nextUrl.searchParams.get("history") === "true";

  let scores: EngineScoreRow[];
  if (wantsHistory) {
    scores = allRows;
  } else {
    const seen = new Set<string>();
    scores = [];
    for (const row of allRows) {
      const key = `${row.engine}:${row.target_locale}`;
      if (!seen.has(key)) {
        seen.add(key);
        scores.push(row);
      }
    }
  }

  return NextResponse.json({
    organization_id: orgId,
    extra_query_credits: extraCredits,
    scores,
  });
}
