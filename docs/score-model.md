# GENESSA — SCORE MODEL

## Overview

3 ayrı skor. Tek overall skor yok (kafa karıştırır).
Free scan'de tüm 3 skor gösterilir ama sadece Readiness detaylı açılır.

---

## Score 1 — AI Readiness Score

**Tanım:** AI botlarının siteyi teknik olarak okuyup okuyamadığı.
**Layer:** Rule engine — LLM gerekmez.
**Free/Premium:** Her ikisinde de tam detay.

### Checks ve Ağırlıklar

| Check | Weight | Pass Kriteri |
|-------|--------|-------------|
| Schema.org JSON-LD | 15% | En az 1 valid schema (Organization veya Person) |
| Answer-first content | 15% | Her sayfada ilk paragraf cevap formatında (bkz. scanner-engine.md) |
| Page speed | 15% | İlk byte < 800ms (fetch timing ile ölç) |
| llms.txt | 10% | /llms.txt 200 dönüyor |
| Robots.txt | 10% | /robots.txt 200 dönüyor, Disallow: / yok |
| Open Graph | 10% | og:title + og:description + og:image mevcut |
| H1/H2 Structure | 10% | Tek H1, en az 2 H2 |
| Freshness | 10% | article:published_time VEYA article:modified_time meta tag mevcut |
| Entity links | 5% | En az 1 Wikipedia/Wikidata/LinkedIn outbound link |

**Partial mantığı:**
- Freshness: partial = sadece biri var (published veya modified, ikisi birden değil)
- Schema: partial = schema var ama Organization/Person eksik
- Answer-first: partial = bazı sayfalarda var, ana sayfada yok

### Hesaplama
```
readiness_score = sum(weight * status)
status: Pass=1.0, Partial=0.5, Missing=0.0
```

---

## Score 2 — AI Authority Score

**Tanım:** AI sistemlerinin markayı güvenilir kaynak olarak algılama ihtimali.
**Layer:** Rule engine (sinyaller) + LLM (yorum). 
**Free/Premium:** Free = sadece skor + 2 bullet. Premium = tam analiz.

### Signals (Rule Engine ile tespit edilir)

| Signal | Weight | Nasıl ölçülür |
|--------|--------|---------------|
| Semantic niche clarity | 20% | Ana başlık + meta desc keyword tutarlılığı, LLM yorumlar |
| Topical depth | 20% | Blog/content sayfası sayısı + kelime sayısı tahmini |
| Author/founder layer | 20% | About sayfasında kişi adı + title + bio mevcut mu |
| Social proof signals | 15% | 3+ sosyal platform linki mevcut mu |
| Entity consistency | 15% | Tüm sayfalarda marka adı tutarlı mı (regex) |
| Content freshness | 10% | Son blog/içerik tarihi 90 günden yeni mi |

**NOT:** Semantic niche clarity için LLM çağrısı yapılır. Diğerleri rule-based.

### LLM çağrısı — Authority için
Sadece şu soruyu sor, kısa cevap dönsün:
```
Analyze this website's niche clarity and semantic authority in 2 sentences.
Focus: is the topical focus clear? Would AI systems trust this as a source?
Content summary: [page title + meta desc + H1s + first paragraphs]
Return JSON: { niche_score: 0-100, niche_summary: "...", authority_signal: "strong/moderate/weak" }
```

---

## Score 3 — AI Influence Score

**Tanım:** Markanın gerçek AI recommendation ve mention potansiyeli.
**Layer:** LLM heavy + AI mention tracking (async job).
**Free/Premium:** Free = kilitli, sadece teaser göster. Premium only.

### Components

| Component | Weight | Nasıl ölçülür |
|-----------|--------|---------------|
| AI mention tracking | 30% | ChatGPT/Perplexity/Claude'a query gönder, marka geçiyor mu |
| Recommendation likelihood | 25% | LLM değerlendirmesi (bkz. ai-insight-layer.md) |
| Citation worthiness | 25% | Content answer-first mi + authoritative tone mu |
| Competitor gap | 20% | Manuel giriş veya user-defined (faz 3) |

### AI Mention Tracking — Önemli Not
Bu sistem "gerçek zamanlı izleme" DEĞİL.
Tanım: "Markanla ilgili konularda AI sistemlerine soruyoruz ve sonuçları kaydediyoruz."
Sorgular: [niche] + "which [service] should I use?" formatında
Frekans: Haftada 1, premium kullanıcılar için.
Dürüst ifade: "We ask AI systems questions in your niche and track whether your brand appears."

**Asla şunu söyleme:** "Real-time AI monitoring" — bu teknik olarak yanlış.

---

## Skor Gösterimi — Free vs Premium

```
Free scan görünümü:
┌─────────────────────────────────────┐
│ AI Readiness    68/100  [tam detay] │
│ AI Authority    52/100  [2 bullet]  │
│ AI Influence    ??/100  [kilitli]   │
└─────────────────────────────────────┘

Premium görünümü:
┌─────────────────────────────────────┐
│ AI Readiness    68/100  [tam detay] │
│ AI Authority    52/100  [tam detay] │
│ AI Influence    41/100  [tam detay] │
└─────────────────────────────────────┘
```

---

## Skor Bandları

| Band | Aralık | Verdict |
|------|--------|---------|
| Strong | 80-100 | "AI systems actively recommend your brand" |
| Good | 65-79 | "AI systems understand your brand well" |
| Mid | 45-64 | "AI systems can find you but won't prioritize you" |
| Weak | 25-44 | "AI systems struggle to understand your brand" |
| Critical | 0-24 | "AI systems cannot reliably identify your brand" |

---

## Skor Değişim Mantığı (Gamification)

Her eksik check için "+X puan kazan" göster.
Maksimum kazan gösterimi: sadece ilk 4 kritik eksik (hepsini listeleme).
Toplam kazanılabilir puan = missing checks toplamı (örn. 4 critical = +40 pts).
