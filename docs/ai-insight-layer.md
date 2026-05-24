# GENESSA — AI INSIGHT LAYER

## Genel Kural
LLM sadece bu dosyada tarif edilen görevler için çağrılır.
Rule engine sonuçları context olarak geçilir — LLM tekrar taramaz.
Model: claude-sonnet-4-* (latest)
Max tokens: 600 per call
Temperature: 0 (deterministik, tutarlı output)

---

## Ne Zaman Çağrılır

| Durum | LLM çağrısı |
|-------|-------------|
| Free scan, ilk kez | 1 kez (cache'e yaz, 7 gün geçerli) |
| Free scan, domain zaten tarandı | Cache'den dön, çağırma |
| Premium scan | Her rescan'de çağır |
| Rule engine check sonuçları | Çağırma, bunlar deterministik |

---

## Input Formatı — Her LLM Çağrısına Gönderilen Context

```typescript
interface InsightContext {
  domain: string
  title: string           // <title> tag
  metaDescription: string
  h1: string
  h2s: string[]           // ilk 5 H2
  firstParagraphs: string[] // her bölümün ilk paragrafı (max 5, 100 kelime each)
  schemaTypes: string[]
  scanResults: {          // rule engine sonuçları
    schema: 'PASS' | 'PARTIAL' | 'MISSING'
    answerFirst: 'PASS' | 'PARTIAL' | 'MISSING'
    entityLinks: 'PASS' | 'PARTIAL' | 'MISSING'
    freshness: 'PASS' | 'PARTIAL' | 'MISSING'
    // diğerleri...
  }
  language: 'tr' | 'en'
}
```

---

## Çağrı 1 — Hero Insight (Free + Premium)

**Amaç:** Sayfanın üstündeki tek cümle "AI assessment" — mevcut "checker-feel" text'ini değiştirir.

**Mevcut (kötü):** "nurdai.com yapay zeka ile ilgili orta ölçekli bir platformdur."
**Hedef:** "AI systems recognize NurdAI's niche clearly, but recommendation signals need stronger authority anchoring."

### Prompt
```
You are an AI visibility analyst. Given a website's content summary and technical scan results,
write ONE sentence (max 25 words) describing how AI systems currently perceive this brand.

Rules:
- Be specific to this brand, not generic
- Mention what AI systems CAN do with this site (positive first)
- Mention the biggest gap
- Tone: professional, direct, no fluff
- Language: {{language}} (tr or en)

Content:
Title: {{title}}
Meta: {{metaDescription}}
H1: {{h1}}
Key sections: {{h2s.join(', ')}}
Technical gaps: {{failedChecks.join(', ')}}

Return JSON only:
{ "hero_text": "..." }
```

---

## Çağrı 2 — Insight Blokları (Free: 2 blok, Premium: 6 blok)

**Amaç:** "Güçlü yan / Kritik boşluk / Hızlı kazanım / Paradoks / Fırsat" blokları.

### Prompt
```
You are an AI visibility strategist. Analyze this website and generate insight blocks.

Content summary:
- Domain: {{domain}}
- Title: {{title}}
- Niche/topic signals: {{h1}}, {{h2s}}
- Technical scan: {{scanResults as JSON}}
- First paragraphs: {{firstParagraphs}}

Generate exactly these insight blocks. Each: 1-2 sentences max, specific, no generic advice.

Return JSON only:
{
  "strongest_point": "What this site does best for AI visibility",
  "critical_gap": "The single most important missing signal",
  "quick_win": "Fastest action with highest AI visibility impact",
  "paradox": "Any contradiction between what they do and what they practice (if exists, else null)",
  "opportunity": "Biggest untapped AI visibility potential",
  "ai_perception": "How AI systems currently see this brand in 1 sentence"
}

Language: {{language}}
Be specific to this domain. Do not give generic SEO advice.
```

**Free scan'de göster:** strongest_point + critical_gap
**Premium'da göster:** tüm 6 blok

---

## Çağrı 3 — Authority Narrative (Premium only)

**Amaç:** AI Authority Score için detaylı yorum.

### Prompt
```
Evaluate this website's AI authority signals in 3 short paragraphs.

Paragraph 1: Niche clarity and semantic authority (is the topical focus clear and consistent?)
Paragraph 2: Trust signals (founder visibility, content depth, social proof)
Paragraph 3: What would make AI systems trust this brand more?

Each paragraph: 2-3 sentences. Specific, not generic.

Website data:
{{fullContext as JSON}}

Return JSON:
{
  "niche_clarity_score": 0-100,
  "niche_clarity_text": "...",
  "trust_signals_score": 0-100,
  "trust_signals_text": "...",
  "improvement_path": "..."
}

Language: {{language}}
```

---

## Çağrı 4 — Recommendation Likelihood (Premium only — AI Influence Score)

**Amaç:** Bu markanın AI sistemlerinde önerilme ihtimalini değerlendir.

### Prompt
```
You are evaluating whether AI systems (ChatGPT, Perplexity, Claude) would recommend this brand
when users ask questions in their niche.

Evaluate based on:
1. Is the brand's expertise clear and specific?
2. Is there enough content depth to be considered authoritative?
3. Are there trust signals AI systems use as source quality indicators?
4. Is the content in answer-first format AI can extract and cite?

Website summary: {{context}}
Technical scan results: {{scanResults}}

Return JSON:
{
  "recommendation_score": 0-100,
  "would_recommend_if": "What would need to change for AI to recommend this brand",
  "current_barrier": "Main reason AI systems might skip this brand as a source",
  "confidence": "high" | "medium" | "low"
}

Important: Do not claim certainty about how specific AI systems actually behave.
Use "likely", "probably", "signals suggest" language.
Language: {{language}}
```

---

## Çağrı 5 — AI Mention Query (Premium — Influence Score, async job)

**Amaç:** AI sistemlerine niche sorular sor, marka geçiyor mu kontrol et.

### Sistem
Bu çağrı SENKRON DEĞİL. Background job olarak haftada 1 çalışır.
Premium kullanıcı için domain'e özel query paketi oluştur.

### Niche Tespiti
```
From this website's title, meta description, and headings, identify:
1. Primary niche (1-3 words)
2. Target audience
3. 3 questions users might ask AI about this niche

Website: {{title}} | {{metaDescription}} | {{h2s}}

Return JSON: { "niche": "...", "audience": "...", "queries": ["...", "...", "..."] }
```

### AI'ya Sorulacak Sorgular (generated queries ile)
Her query için Claude API'ye sor:
```
[QUERY: "best [niche] [service] in [location/context]"]
Does the brand "{{brandName}}" ({{domain}}) appear in your response?
Answer: yes / no / partially
```

**Önemli:** Bu bir simulation değil, gerçek query. Ama kullanıcıya şunu söyle:
"We asked AI systems questions in your niche and checked if your brand appeared."
ASLA: "Real-time AI monitoring" veya "We track all AI mentions."

---

## Fallback / Hata Yönetimi

- LLM timeout veya hata → cached generic insight göster (domain-agnostic template)
- Parse hatası (JSON invalid) → retry 1 kez, sonra fallback
- Fallback template örneği:
```json
{
  "hero_text": "Technical signals are partially in place, but AI recommendation signals need strengthening.",
  "strongest_point": "Site structure allows AI bots to crawl content effectively.",
  "critical_gap": "Structured data is missing, limiting AI's ability to understand your brand identity."
}
```

---

## Token Bütçesi

| Çağrı | Input tokens | Output tokens | Toplam |
|-------|-------------|--------------|--------|
| Hero insight | ~300 | ~50 | ~350 |
| Insight blokları | ~400 | ~250 | ~650 |
| Authority narrative | ~450 | ~300 | ~750 |
| Recommendation | ~400 | ~200 | ~600 |
| Niche detection | ~200 | ~100 | ~300 |

Free scan (1 çağrı): ~1000 token
Premium full scan: ~2650 token
Monthly cost estimate (1000 premium scans): ~$5-8 (Sonnet pricing)
