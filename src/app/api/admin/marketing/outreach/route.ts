import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (req.headers.get("x-admin-secret") !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sector, companyName, contactName } = await req.json();
  if (!sector || !companyName) return NextResponse.json({ error: "sector and companyName required" }, { status: 400 });

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
          content: `Write 3 cold outreach messages for Genessa targeting a ${sector} business called ${companyName}.
Contact name: ${contactName || "there"}.

Message 1: LinkedIn connection request (max 300 chars)
Message 2: LinkedIn follow-up message (max 500 chars)
Message 3: Cold email (subject + body, max 200 words)

Return ONLY valid JSON:
{
  "linkedin_connect": "...",
  "linkedin_followup": "...",
  "email_subject": "...",
  "email_body": "..."
}`,
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
  return NextResponse.json({
    linkedin_connect: parsed.linkedin_connect ?? "",
    linkedin_followup: parsed.linkedin_followup ?? "",
    email_subject: parsed.email_subject ?? "",
    email_body: parsed.email_body ?? "",
  });
}
