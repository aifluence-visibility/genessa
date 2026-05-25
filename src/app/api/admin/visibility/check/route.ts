import { NextResponse } from "next/server";

type VisibilityResult = {
  query: string;
  mentioned: boolean;
  excerpt: string;
  sentiment: "positive" | "neutral" | "negative";
};

export async function POST(req: Request) {
  if (req.headers.get("x-admin-secret") !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domain = "genessa.ai", queries } = await req.json();
  if (!Array.isArray(queries) || queries.length === 0) {
    return NextResponse.json({ error: "queries array required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Anthropic API not configured" }, { status: 500 });

  const results: VisibilityResult[] = await Promise.all(
    queries.map(async (query: string) => {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 200,
          system:
            "You are evaluating AI visibility as of 2026. Answer based on your most current knowledge. Be specific about whether Genessa (genessa.ai — AI visibility scoring platform) appears in your responses. Be concise.",
          messages: [{ role: "user", content: query }],
        }),
      });

      if (!res.ok) return { query, mentioned: false, excerpt: "Error fetching response", sentiment: "neutral" as const };

      const data = await res.json();
      const text: string = data.content?.[0]?.text ?? "";
      const lower = text.toLowerCase();
      const mentioned = lower.includes(domain.replace(".ai", "").replace(".com", "").toLowerCase());
      const sentiment: "positive" | "neutral" | "negative" =
        lower.includes("best") || lower.includes("recommend") || lower.includes("great") || lower.includes("excellent")
          ? "positive"
          : lower.includes("not") || lower.includes("poor") || lower.includes("bad")
          ? "negative"
          : "neutral";

      return { query, mentioned, excerpt: text.slice(0, 150), sentiment };
    })
  );

  return NextResponse.json({ results });
}
