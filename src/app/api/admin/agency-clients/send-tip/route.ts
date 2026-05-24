import { NextResponse } from "next/server";

const SECTOR_AGENTS: Record<string, { name: string; title: string; sectorLabel: string }> = {
  restaurant: { name: "Savor",  title: "Restaurant Intelligence Operator",  sectorLabel: "Restaurant" },
  hotel:      { name: "Haven",  title: "Hospitality Intelligence Operator", sectorLabel: "Hospitality" },
  clinic:     { name: "Vita",   title: "Medical Intelligence Operator",     sectorLabel: "Medical" },
  ecommerce:  { name: "Flux",   title: "Commerce Intelligence Operator",    sectorLabel: "Commerce" },
  saas:       { name: "Nexus",  title: "SaaS Intelligence Operator",        sectorLabel: "SaaS" },
  legal:      { name: "Vero",   title: "Legal Intelligence Operator",       sectorLabel: "Legal" },
  creator:    { name: "Lumen",  title: "Creator Intelligence Operator",     sectorLabel: "Creator" },
};

export async function POST(req: Request) {
  const body = await req.json();
  const { agencyEmail, clientDomain, clientSector, clientNickname, readiness, authority, influence, topIssues, adminSecret } = body;

  if (adminSecret !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!agencyEmail || !clientDomain) {
    return NextResponse.json({ error: "agencyEmail and clientDomain required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Anthropic API not configured" }, { status: 500 });

  const agent = SECTOR_AGENTS[clientSector] ?? { name: "Genessa", title: "AI Visibility Operator", sectorLabel: "AI Visibility" };
  const issuesList = Array.isArray(topIssues) ? topIssues.join(", ") : (topIssues ?? "None identified");

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
      system: `You are ${agent.name}, an AI visibility specialist for ${clientSector ?? "business"} businesses. Write in native, professional English.`,
      messages: [
        {
          role: "user",
          content: `Write a concise advisory email to an agency client.

Client: ${clientNickname ?? clientDomain} (${clientDomain})
Sector: ${clientSector ?? "general"}
Current Scores:
- AI Readiness: ${readiness ?? "N/A"}/100
- AI Authority: ${authority ?? "N/A"}/100
- AI Influence: ${influence ?? "N/A"}/100

Top Issues: ${issuesList}

Email requirements:
- Subject line
- Hey [Client Name],
- 2-3 paragraphs: what we found, why it matters, what to do
- One specific quick win they can implement this week
- Warm, expert tone
- Max 200 words

Return ONLY valid JSON:
{
  "subject": "...",
  "body": "..."
}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { subject: "", body: text };

  return NextResponse.json({ subject: parsed.subject ?? "", body: parsed.body ?? "" });
}
