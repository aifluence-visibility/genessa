import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (req.headers.get("x-admin-secret") !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { period } = await req.json();
  if (!period) return NextResponse.json({ error: "period required" }, { status: 400 });

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
      max_tokens: 800,
      system: "You are a native English growth marketer for Genessa, an AI visibility platform.",
      messages: [
        {
          role: "user",
          content: `Write a weekly growth strategy report for Genessa AI visibility platform.
Period: ${period}

Include:
1. Top 3 growth opportunities this week
2. Which sectors to target and why
3. Recommended content topics (5 ideas)
4. Outreach targets (types of businesses)
5. One bold experiment to try

Write in native English, executive tone. Max 400 words.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json({ error: body }, { status: 500 });
  }

  const data = await res.json();
  const report = data.content?.[0]?.text ?? "";
  return NextResponse.json({ report });
}
