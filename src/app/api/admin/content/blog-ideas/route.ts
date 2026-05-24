import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (req.headers.get("x-admin-secret") !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sector } = await req.json();
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
      max_tokens: 600,
      system:
        "You are a native English content strategist specializing in AI visibility and digital marketing. Write in professional, engaging American English.",
      messages: [
        {
          role: "user",
          content: `Generate 5 compelling blog post titles for ${sector} businesses about AI visibility and discoverability. Topics should be practical and data-driven. Return ONLY valid JSON: { "titles": ["title1", ...] } No markdown, no explanation.`,
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
  return NextResponse.json({ titles: parsed.titles ?? [] });
}
