export const runtime = "edge";

export async function GET() {
  const pages = [
    "",
    "/how-it-works",
    "/directory",
    "/pricing",
  ];

  const base = "https://genessa.io";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url>
    <loc>${base}${p}</loc>
    <changefreq>weekly</changefreq>
    <priority>${p === "" ? "1.0" : "0.8"}</priority>
  </url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
