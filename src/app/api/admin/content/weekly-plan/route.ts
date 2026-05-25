import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";

export async function POST(req: Request) {
  if (req.headers.get("x-admin-secret") !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Admin client not configured" }, { status: 500 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Anthropic API not configured" }, { status: 500 });

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [profilesResult, weekScansResult, highScoreResult] = await Promise.all([
    admin.from("profiles").select("id, plan"),
    admin.from("scans").select("user_id").gte("created_at", oneWeekAgo),
    admin.from("scans").select("user_id").gte("readiness_score", 70),
  ]);

  const planDist = { free: 0, premium: 0, agency: 0 };
  const freeUserIds = new Set<string>();
  for (const p of (profilesResult.data ?? []) as { id: string; plan: string }[]) {
    const plan = (p.plan ?? "free") as keyof typeof planDist;
    if (plan in planDist) planDist[plan]++;
    if ((p.plan ?? "free") === "free") freeUserIds.add(p.id);
  }

  const scannedThisWeek = new Set(
    (weekScansResult.data ?? []).map((s: { user_id: string }) => s.user_id)
  ).size;

  const highScoreUserIds = new Set(
    (highScoreResult.data ?? []).map((s: { user_id: string }) => s.user_id)
  );
  const hotProspects = [...highScoreUserIds].filter((id) => freeUserIds.has(id)).length;

  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: "You are a CRM and email marketing specialist for Genessa, an AI visibility platform.",
      messages: [
        {
          role: "user",
          content: `Based on this week's data, suggest 5 email campaigns to send.

Current data:
- Free users: ${planDist.free}
- Premium users: ${planDist.premium}
- Agency users: ${planDist.agency}
- Scanned this week: ${scannedThisWeek}
- Hot prospects (score 70+, free plan): ${hotProspects}

For each campaign suggest:
1. Who to send to (audience segment)
2. Subject line
3. Goal (convert/retain/upsell)
4. Best day to send
5. One-line content brief

Return ONLY valid JSON:
{
  "campaigns": [
    {
      "audience": "...",
      "subject": "...",
      "goal": "...",
      "send_day": "...",
      "brief": "..."
    }
  ]
}`,
        },
      ],
    }),
  });

  if (!claudeRes.ok) {
    const errText = await claudeRes.text();
    return NextResponse.json({ error: errText }, { status: 500 });
  }

  const claudeData = await claudeRes.json();
  const rawText = claudeData.content?.[0]?.text ?? "{}";

  try {
    const parsed = JSON.parse(rawText);
    return NextResponse.json({ campaigns: parsed.campaigns ?? [] });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response", raw: rawText }, { status: 500 });
  }
}
