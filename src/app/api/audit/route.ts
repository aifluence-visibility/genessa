import { NextRequest } from "next/server";

export const runtime = "edge";

interface CheckResult {
  name: string;
  status: "pass" | "partial" | "fail";
  points: number;
  weight: number;
  impact: string;
  action: string;
}

async function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "GenessaBot/1.0" } });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchHTML(domain: string): Promise<string> {
  try {
    const res = await fetchWithTimeout(`https://${domain}`);
    return await res.text();
  } catch {
    try {
      const res = await fetchWithTimeout(`http://${domain}`);
      return await res.text();
    } catch {
      return "";
    }
  }
}

function checkSchema(html: string): CheckResult {
  const weight = 25;
  const scripts = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];

  if (scripts.length > 0) {
    let valid = 0;
    for (const s of scripts) {
      const content = s.replace(/<\/?script[^>]*>/gi, "").trim();
      try {
        JSON.parse(content);
        valid++;
      } catch { /* skip invalid */ }
    }
    if (valid > 0) {
      return {
        name: "Schema.org",
        status: "pass",
        points: weight,
        weight,
        impact: "ChatGPT kaynak gösterme ihtimali artar",
        action: `${valid} JSON-LD blok bulundu`,
      };
    }
  }

  const hasMicrodata = /itemscope|itemtype/i.test(html);
  if (hasMicrodata) {
    return {
      name: "Schema.org",
      status: "partial",
      points: Math.round(weight * 0.5),
      weight,
      impact: "Microdata var ama JSON-LD tercih edilir",
      action: "Ana sayfaya JSON-LD ekle → +13 puan",
    };
  }

  return {
    name: "Schema.org",
    status: "fail",
    points: 0,
    weight,
    impact: "AI botları içeriğini yapılandırılmış veri olmadan anlamakta zorlanıyor",
    action: "Ana sayfaya JSON-LD ekle → +25 puan",
  };
}

async function checkLlmsTxt(domain: string): Promise<CheckResult> {
  const weight = 20;
  try {
    const res = await fetchWithTimeout(`https://${domain}/llms.txt`);
    if (res.ok) {
      const text = await res.text();
      if (text.length > 20) {
        return {
          name: "llms.txt",
          status: "pass",
          points: weight,
          weight,
          impact: "AI botları içeriğini doğrudan okuyabiliyor",
          action: "llms.txt mevcut ve geçerli",
        };
      }
    }
  } catch { /* fail */ }

  return {
    name: "llms.txt",
    status: "fail",
    points: 0,
    weight,
    impact: "AI botları içeriğini anlayamıyor",
    action: "llms.txt dosyası oluştur → +20 puan",
  };
}

async function checkRobotsTxt(domain: string): Promise<CheckResult> {
  const weight = 20;
  const bots = ["GPTBot", "ClaudeBot", "PerplexityBot"];

  try {
    const res = await fetchWithTimeout(`https://${domain}/robots.txt`);
    if (!res.ok) {
      return {
        name: "Robots.txt",
        status: "fail",
        points: 0,
        weight,
        impact: "robots.txt bulunamadı — AI botları erişim politikası belirsiz",
        action: "robots.txt oluştur ve AI botlarına izin ver → +20 puan",
      };
    }

    const text = await res.text();
    const lower = text.toLowerCase();

    let allowed = 0;
    const blocked: string[] = [];

    for (const bot of bots) {
      const botSection = new RegExp(`user-agent:\\s*${bot.toLowerCase()}[\\s\\S]*?(?=user-agent:|$)`, "i");
      const match = lower.match(botSection);
      if (match) {
        if (/disallow:\s*\/\s*$/m.test(match[0])) {
          blocked.push(bot);
        } else {
          allowed++;
        }
      } else {
        const wildcardSection = lower.match(/user-agent:\s*\*[\s\S]*?(?=user-agent:|$)/i);
        if (wildcardSection && /disallow:\s*\/\s*$/m.test(wildcardSection[0])) {
          blocked.push(bot);
        } else {
          allowed++;
        }
      }
    }

    if (blocked.length === 0) {
      return { name: "Robots.txt", status: "pass", points: weight, weight, impact: "Tüm AI botlarına erişim açık", action: "robots.txt düzgün yapılandırılmış" };
    }
    if (allowed > 0) {
      return {
        name: "Robots.txt",
        status: "partial",
        points: Math.round(weight * (allowed / bots.length)),
        weight,
        impact: `${blocked.join(", ")} engelleniyor`,
        action: `robots.txt'e ${blocked.join(", ")} Allow ekle → +${weight - Math.round(weight * (allowed / bots.length))} puan`,
      };
    }

    return {
      name: "Robots.txt",
      status: "fail",
      points: 0,
      weight,
      impact: "Tüm AI botları engelleniyor",
      action: "robots.txt'e GPTBot: Allow ekle → +20 puan",
    };
  } catch {
    return { name: "Robots.txt", status: "fail", points: 0, weight, impact: "robots.txt okunamadı", action: "robots.txt oluştur → +20 puan" };
  }
}

function checkOpenGraph(html: string): CheckResult {
  const weight = 20;
  const tags = ["og:title", "og:description", "og:image"];
  let found = 0;
  const missing: string[] = [];

  for (const tag of tags) {
    const regex = new RegExp(`<meta[^>]*property=["']${tag}["'][^>]*content=["'][^"']+["']`, "i");
    const regex2 = new RegExp(`<meta[^>]*content=["'][^"']+["'][^>]*property=["']${tag}["']`, "i");
    if (regex.test(html) || regex2.test(html)) {
      found++;
    } else {
      missing.push(tag);
    }
  }

  if (found === tags.length) {
    return { name: "Open Graph", status: "pass", points: weight, weight, impact: "AI ve sosyal medya önizlemeleri tam", action: "Tüm OG etiketleri mevcut" };
  }
  if (found > 0) {
    return {
      name: "Open Graph",
      status: "partial",
      points: Math.round(weight * (found / tags.length)),
      weight,
      impact: `Eksik: ${missing.join(", ")}`,
      action: `${missing.join(", ")} ekle → +${weight - Math.round(weight * (found / tags.length))} puan`,
    };
  }
  return {
    name: "Open Graph",
    status: "fail",
    points: 0,
    weight,
    impact: "Open Graph etiketleri bulunamadı — AI ve sosyal paylaşımlarda önizleme yok",
    action: "og:title, og:description, og:image ekle → +20 puan",
  };
}

function checkEntityLinks(html: string): CheckResult {
  const weight = 15;
  const wikidata = (html.match(/wikidata\.org/gi) || []).length;
  const wikipedia = (html.match(/wikipedia\.org/gi) || []).length;
  const total = wikidata + wikipedia;

  if (total >= 3) {
    return { name: "Entity Links", status: "pass", points: weight, weight, impact: "AI varlık tanıma doğruluğu yüksek", action: `${total} entity link bulundu` };
  }
  if (total > 0) {
    return {
      name: "Entity Links",
      status: "partial",
      points: Math.round(weight * 0.5),
      weight,
      impact: `${total} entity link bulundu, 3+ önerilir`,
      action: `Wikidata/Wikipedia bağlantıları ekle → +${weight - Math.round(weight * 0.5)} puan`,
    };
  }
  return {
    name: "Entity Links",
    status: "fail",
    points: 0,
    weight,
    impact: "Yapılandırılmış varlık bağlantısı yok — AI doğru kaynak eşlemesi yapamıyor",
    action: "Wikidata veya Wikipedia bağlantıları ekle → +15 puan",
  };
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return Response.json({ error: "url parameter is required" }, { status: 400 });
  }

  const domain = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();

  const [html, llmsResult, robotsResult] = await Promise.all([
    fetchHTML(domain),
    checkLlmsTxt(domain),
    checkRobotsTxt(domain),
  ]);

  const schemaResult = checkSchema(html);
  const ogResult = checkOpenGraph(html);
  const entityResult = checkEntityLinks(html);

  const checks: CheckResult[] = [schemaResult, llmsResult, robotsResult, ogResult, entityResult];
  const score = checks.reduce((sum, c) => sum + c.points, 0);

  return Response.json({
    url: domain,
    score,
    checks,
  });
}
