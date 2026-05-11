import { NextRequest } from "next/server";

export const runtime = "edge";

function makeBadgeSVG(domain: string, score: number): string {
  let label: string;
  let color: string;
  let starIcon = "";

  if (score >= 90) {
    label = "AI Trusted";
    color = "#4B7BFF";
    starIcon = `<polygon points="142,6 143.8,10 148,10.5 145,13.3 145.7,17.5 142,15.5 138.3,17.5 139,13.3 136,10.5 140.2,10" fill="#FFD700" stroke="none"/>`;
  } else if (score >= 80) {
    label = "AI Verified";
    color = "#4B7BFF";
  } else {
    label = "AI Scored";
    color = "#9A9AA6";
  }

  const text = `${label} · Genessa`;
  const textWidth = text.length * 6.2 + 20;
  const totalWidth = Math.round(textWidth + (score >= 90 ? 20 : 0));
  const height = 24;
  const r = height / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}">
  <rect rx="${r}" ry="${r}" width="${totalWidth}" height="${height}" fill="${color}"/>
  <text x="${score >= 90 ? 24 : 10}" y="16" fill="#fff" font-family="system-ui,-apple-system,sans-serif" font-size="11" font-weight="500">${text}</text>
  ${starIcon}
</svg>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain } = await params;

  let score = 0;
  try {
    const origin = request.nextUrl.origin;
    const res = await fetch(`${origin}/api/audit?url=${encodeURIComponent(domain)}`);
    if (res.ok) {
      const data = await res.json();
      score = data.score ?? 0;
    }
  } catch {
    score = 0;
  }

  const svg = makeBadgeSVG(domain, score);

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
