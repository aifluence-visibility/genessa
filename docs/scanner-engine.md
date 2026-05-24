# GENESSA — SCANNER ENGINE

## Genel Kural
Bu dosyadaki TÜM kontroller LLM kullanmaz.
Cheerio + regex + fetch ile çözülür.
Hızlı, ucuz, deterministik.

---

## Scan Pipeline

```
1. URL al → normalize et (trailing slash, www/no-www)
2. HTML fetch (timeout: 10s, user-agent: Genessabot/1.0)
3. Cheerio parse
4. Her check'i paralel çalıştır
5. Results aggregate → score-model.md hesaplama
6. Cache'e yaz (domain + tarih)
```

---

## Check 1 — Schema.org JSON-LD

```javascript
// <script type="application/ld+json"> taglarını bul
const schemas = $('script[type="application/ld+json"]')
const types = schemas.map(s => JSON.parse(s).@type)

// Pass kriterleri:
// - Organization veya LocalBusiness veya Person: PASS
// - FAQPage: PASS (bonus)
// - Service veya WebSite: PARTIAL
// - Hiçbiri: MISSING

// Hata yönetimi: parse hatası → MISSING say
```

**Özel kontrol:** FAQPage schema varsa answer-first check'e +bonus ver (ikisi birbirini doğrular).

---

## Check 2 — Answer-First Detection ⚠️ KRİTİK

Bu check %15 ağırlıklı. Algoritma:

### Adım 1 — Hedef paragrafları al
```javascript
// Her H1, H2, H3'ün hemen ardından gelen ilk <p>'yi al
const sections = []
$('h1, h2, h3').each((i, el) => {
  const firstP = $(el).next('p').first().text().trim()
  if (firstP.length > 20) sections.push(firstP)
})

// Ayrıca ana sayfanın ilk <p>'sini al (hero section)
const heroP = $('main p, .hero p, section p').first().text().trim()
```

### Adım 2 — Answer-first pattern kontrolü
Bir paragraf şu kriterlerden en az 2'sini karşılıyorsa ANSWER-FIRST sayılır:

```javascript
function isAnswerFirst(text) {
  const sentence1 = text.split(/[.!?]/)[0].trim()
  
  const patterns = [
    // Tanım kalıbı (TR + EN)
    /^[A-ZÇĞİÖŞÜa-zçğışöüA-Z].{0,60}(dır|dir|tir|tür|tur|dur|dur|is |are |refers to|means )/i,
    // Doğrudan hizmet/ürün açıklaması
    /^(we |our |this |bu |bu hizmet|bu ürün|bu araç)/i,
    // Kısa ilk cümle (≤ 25 kelime = direkt ve net)
    sentence1.split(' ').length <= 25,
    // Soru-cevap formatı (FAQ)
    /^(evet|hayır|yes|no|generally|typically|genellikle|çoğunlukla)/i,
  ]
  
  const matchCount = patterns.filter(p => 
    typeof p === 'boolean' ? p : p.test(text)
  ).length
  
  return matchCount >= 2
}
```

### Adım 3 — Skor hesapla
```javascript
const answerFirstCount = sections.filter(isAnswerFirst).length
const ratio = answerFirstCount / sections.length

if (ratio >= 0.6) return 'PASS'      // %60+ bölüm answer-first
if (ratio >= 0.3) return 'PARTIAL'   // %30-60 arası
return 'MISSING'                      // %30 altı
```

### Önemli Not
Answer-first check hem AI Readiness Score'da teknik sinyal olarak hem de
ai-insight-layer.md'de "extractability" değerlendirmesinde kullanılır.
Rule engine sonucunu insight layer'a context olarak geç.

---

## Check 3 — Schema Türleri Listesi (tam tespit için)

```javascript
const PRIORITY_SCHEMAS = [
  'Organization', 'LocalBusiness', 'Person',           // En yüksek değer
  'FAQPage', 'HowTo', 'Article', 'BlogPosting',        // İçerik şemaları
  'Service', 'Product', 'WebSite', 'WebPage',           // Yapısal
  'BreadcrumbList', 'SiteLinksSearchBox'                // Navigasyon
]
```

Raporda göster: "Bu şemalar mevcut: [liste]" + "Bu şemalar eksik (önerilen): [liste]"

---

## Check 4 — llms.txt

```javascript
// /llms.txt endpoint'ini fetch et
const res = await fetch(`${domain}/llms.txt`, { timeout: 5000 })
if (res.status === 200) return 'PASS'
if (res.status === 404) return 'MISSING'
return 'MISSING' // diğer hatalar
```

**Bonus kontrol:** `/llms-full.txt` de varsa insight'ta belirt.

---

## Check 5 — Robots.txt

```javascript
const res = await fetch(`${domain}/robots.txt`)
const text = await res.text()

// PASS kriterleri:
// - 200 dönüyor
// - "Disallow: /" YOK (herkese kapalı değil)
// - GPTBot, ClaudeBot, PerplexityBot için Disallow YOK

// PARTIAL: Bazı AI botları engellenmiş ama hepsi değil
// MISSING/FAIL: Disallow: / veya tüm AI botları engellenmiş

const blockedBots = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Googlebot-Extended']
const blockedCount = blockedBots.filter(bot => 
  text.includes(`User-agent: ${bot}`) && text.includes('Disallow: /')
).length
```

---

## Check 6 — Open Graph

```javascript
const required = ['og:title', 'og:description', 'og:image', 'og:url']
const found = required.filter(tag => $(`meta[property="${tag}"]`).length > 0)

if (found.length === 4) return 'PASS'
if (found.length >= 2) return 'PARTIAL'
return 'MISSING'
```

---

## Check 7 — H1/H2 Structure

```javascript
const h1Count = $('h1').length
const h2Count = $('h2').length

// PASS: Tam olarak 1 H1 ve en az 2 H2
// PARTIAL: H1 var ama H2 az (0-1), veya H1 çoklu
// MISSING: H1 yok
```

---

## Check 8 — Freshness

```javascript
// Kontrol sırası:
const sources = [
  $('meta[property="article:published_time"]').attr('content'),
  $('meta[property="article:modified_time"]').attr('content'),
  $('meta[name="last-modified"]').attr('content'),
  // HTTP header: Last-Modified
  response.headers.get('last-modified')
]

const latestDate = sources.filter(Boolean).map(d => new Date(d)).sort().pop()

if (!latestDate) return 'MISSING'

const daysSince = (Date.now() - latestDate) / (1000 * 60 * 60 * 24)
if (daysSince <= 90) return 'PASS'
if (daysSince <= 180) return 'PARTIAL'
return 'MISSING' // 6 aydan eski veya tarih yok
```

**Partial tanımı:** Tarih var ama sadece biri (published veya modified, ikisi birden değil)
veya tarih 90-180 gün arasında.

---

## Check 9 — Entity Links

```javascript
// Wikipedia, Wikidata, LinkedIn, Crunchbase, Forbes outbound link var mı?
const authorityDomains = [
  'wikipedia.org', 'wikidata.org', 'linkedin.com',
  'crunchbase.com', 'forbes.com', 'bloomberg.com'
]

const links = $('a[href]').map((i, el) => $(el).attr('href')).get()
const entityLinks = links.filter(href => 
  authorityDomains.some(domain => href.includes(domain))
)

if (entityLinks.length >= 2) return 'PASS'
if (entityLinks.length === 1) return 'PARTIAL'
return 'MISSING'
```

---

## Check 10 — Page Speed (basit)

```javascript
// Fetch timing ile ölç
const start = Date.now()
await fetch(url, { method: 'HEAD' })
const ttfb = Date.now() - start  // Time to First Byte (ms)

if (ttfb < 500) return 'PASS'
if (ttfb < 1500) return 'PARTIAL'
return 'MISSING' // > 1.5s yavaş
```

---

## Scan Output Formatı

```typescript
interface ScanResult {
  domain: string
  scannedAt: Date
  checks: {
    schema: CheckResult
    answerFirst: CheckResult
    pageSpeed: CheckResult
    llmsTxt: CheckResult
    robotsTxt: CheckResult
    openGraph: CheckResult
    h1h2: CheckResult
    freshness: CheckResult
    entityLinks: CheckResult
  }
  metadata: {
    title: string
    description: string
    h1: string
    h2s: string[]
    schemaTypes: string[]
    pageSpeedMs: number
    hasLlmsTxt: boolean
    blockedBots: string[]
  }
}

type CheckResult = {
  status: 'PASS' | 'PARTIAL' | 'MISSING'
  detail: string  // insan okunabilir açıklama
  points: number  // kazanılabilir puan (MISSING ise)
}
```

---

## Hata Yönetimi

- Fetch timeout (>10s) → tüm checks MISSING, "Scan failed: timeout" error
- Parse hatası → ilgili check MISSING
- 404/5xx → "Site unreachable" error, scan iptal
- Redirect loop → 3 redirect sonrası dur
