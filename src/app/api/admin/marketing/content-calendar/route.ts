import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (req.headers.get("x-admin-secret") !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sector, week } = await req.json();
  if (!sector) return NextResponse.json({ error: "sector required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Anthropic API not configured" }, { status: 500 });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: "You are a native English growth marketer for Genessa, an AI visibility platform.",
      messages: [
        {
          role: "user",
          content: `Create a 7-day content calendar for Genessa focusing on ${sector} businesses${week ? ` for ${week}` : ""}. Make all topics relevant for 2026. Include current AI search trends.
For each day include:
- Platform (LinkedIn/Twitter/Blog)
- Topic
- Hook (first line)
- Best posting time
Return ONLY valid JSON:
{ "calendar": [
  { "day": 1, "platform": "...", "topic": "...", "hook": "...", "time": "..." }
] }`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json({ error: body }, { status: 500 });
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "{}";
  const parsed = JSON.parse(text);
  return NextResponse.json({ calendar: parsed.calendar ?? [] });
}
