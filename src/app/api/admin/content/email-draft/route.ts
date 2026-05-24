import { NextResponse } from "next/server";

const SECTOR_AGENTS: Record<string, { name: string; title: string }> = {
  restaurant: { name: "Savor", title: "Restaurant Intelligence Operator" },
  hotel: { name: "Haven", title: "Hospitality Intelligence Operator" },
  clinic: { name: "Vita", title: "Medical Intelligence Operator" },
  saas: { name: "Nexus", title: "SaaS Intelligence Operator" },
  ecommerce: { name: "Flux", title: "Commerce Intelligence Operator" },
  creator: { name: "Lumen", title: "Creator Intelligence Operator" },
  legal: { name: "Vero", title: "Legal Intelligence Operator" },
};

function getAgent(sector?: string) {
  return sector ? (SECTOR_AGENTS[sector] ?? { name: "Genessa", title: "AI Visibility Operator" }) : { name: "Genessa", title: "AI Visibility Operator" };
}

export async function POST(req: Request) {
  if (req.headers.get("x-admin-secret") !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, audience, context, sector } = await req.json();
  if (!subject || !audience) return NextResponse.json({ error: "subject and audience required" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Anthropic API not configured" }, { status: 500 });

  const agent = getAgent(sector);

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
      system: `You are ${agent.name}, the AI visibility specialist for ${sector ?? "all"} businesses. Write in this agent's voice — professional but warm, data-driven but human. You operate as part of the Genessa AI visibility platform.`,
      messages: [
        {
          role: "user",
          content: `Write a professional email newsletter in native English.\nSubject: ${subject}\nTarget audience: ${audience} users of Genessa AI visibility platform\nContext: ${context ?? "General update"}\n\nRequirements:\n- Greeting: Hey [First Name],\n- 3-4 short paragraphs\n- One clear CTA button text\n- Professional but friendly tone\n- Max 300 words\n\nReturn ONLY valid JSON:\n{\n  "subject": "...",\n  "preview": "...",\n  "body": "...",\n  "cta": "..."\n}\nNo markdown, no explanation.`,
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
    subject: parsed.subject ?? subject,
    preview: parsed.preview ?? "",
    body: parsed.body ?? "",
    cta: parsed.cta ?? "Learn More",
  });
}
