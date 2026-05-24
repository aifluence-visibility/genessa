import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (req.headers.get("x-admin-secret") !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain, sector } = await req.json();
  if (!domain || !sector) return NextResponse.json({ error: "domain and sector required" }, { status: 400 });

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
          content: `Write a professional case study outline for a ${sector} business (${domain}) improving their AI visibility. Structure with these exact sections:\n# The Challenge\n# Our Approach\n# Results\n# Key Takeaways\nWrite in native English. Be specific and compelling. Max 400 words.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json({ error: body }, { status: 500 });
  }

  const data = await res.json();
  const content = data.content?.[0]?.text ?? "";
  return NextResponse.json({ content });
}
