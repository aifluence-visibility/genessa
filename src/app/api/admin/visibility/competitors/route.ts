import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (req.headers.get("x-admin-secret") !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
      max_tokens: 1200,
      system: "You are a competitive intelligence analyst.",
      messages: [
        {
          role: "user",
          content: `List the top 5 competitors to Genessa (an AI visibility scoring platform for businesses).
For each competitor analyze:
- Name and website
- Main value proposition
- Strengths (2-3 points)
- Weaknesses (2-3 points)
- Genessa's advantage over them

Return ONLY valid JSON:
{ "competitors": [
  {
    "name": "...",
    "website": "...",
    "proposition": "...",
    "strengths": ["..."],
    "weaknesses": ["..."],
    "genessa_advantage": "..."
  }
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
  return NextResponse.json({ competitors: parsed.competitors ?? [] });
}
