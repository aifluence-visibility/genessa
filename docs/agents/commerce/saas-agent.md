# SaaS Agent OS
## Genessa Vertical Intelligence — Software as a Service

> **Hedef:** SaaS ürününü AI sistemlerinin (ChatGPT, Perplexity, Claude, Gemini) önerdiği,  
> karşılaştırma sorgularında gösterdiği, güvenilir kaynak olarak tanıdığı bir ürüne dönüştürmek.

---

## Sektör Profili

**Neden kritik:**
- AI alışveriş ve keşif davranışı SaaS'ta en hızlı büyüyor
- "Best CRM tool for startups" gibi sorgular artık Google'da değil, ChatGPT'de yapılıyor
- Karşılaştırma keyword'leri (vs, alternative, review) AI tarafından yorumlanıyor
- Documentation kalitesi AI citation'ı doğrudan etkiliyor
- Reddit/HackerNews/ProductHunt varlığı AI güvenilirlik sinyali

**Scoring Ağırlıkları:**
- AI Readiness: %30
- Authority: %30
- Influence (AI citation): %40

---

## FAZ 1 — Kritik Teknik Altyapı (1-2 Hafta)

### Schema.org
- [ ] `SoftwareApplication` schema ana sayfada
- [ ] `applicationCategory` doğru tanımlanmış
- [ ] `operatingSystem` belirtilmiş
- [ ] `offers` ile pricing schema
- [ ] `aggregateRating` entegre (G2, Capterra, ProductHunt)
- [ ] `Organization` schema (founder, HQ, kuruluş tarihi)
- [ ] `FAQPage` schema (pricing, features, integrations sayfaları)
- [ ] `HowTo` schema (onboarding / feature kullanımı)
- [ ] `BreadcrumbList` tüm sayfalarda

### llms.txt
- [ ] `/llms.txt` oluşturulmuş
- [ ] Ürün ne yapar — 2-3 net cümle
- [ ] Kimler için — ICP (Ideal Customer Profile) net
- [ ] Ana özellikler listesi
- [ ] Entegrasyonlar listesi
- [ ] Pricing tiers
- [ ] Belgelendirme URL'leri
- [ ] Founder/team bilgisi
- [ ] `/llms-full.txt` detaylı versiyon

### Robots.txt
- [ ] GPTBot: Allow
- [ ] ClaudeBot: Allow
- [ ] PerplexityBot: Allow
- [ ] Google-Extended: Allow
- [ ] Applebot-Extended: Allow
- [ ] Sitemap URL'i eklenmiş

### Documentation & Content
- [ ] Docs sitesi var (`docs.domain.com` veya `/docs`)
- [ ] Her feature sayfasının ayrı URL'i
- [ ] API documentation public erişilebilir
- [ ] Changelog public
- [ ] Glossary / terimler sayfası
- [ ] Integration sayfaları (`/integrations/slack`, `/integrations/zapier`)

### Teknik Altyapı
- [ ] Core Web Vitals geçiyor
- [ ] Canonical URL'ler doğru
- [ ] Hreflang (çok dilli ise)
- [ ] 404 sayfaları yönetiliyor
- [ ] Sitemap güncel ve robots.txt'e referans veriyor

---

## FAZ 2 — Entity Otoritesi (1 Ay)

### Wikidata / Wikipedia
- [ ] Wikidata'ya şirket kaydı (`instance of: software company`)
- [ ] Ürün Wikidata'ya eklenmiş (`instance of: software`)
- [ ] Wikipedia sayfası (yeterli notability varsa)
- [ ] `sameAs` bağlantıları: Crunchbase, GitHub, LinkedIn, ProductHunt
- [ ] `founder` bilgisi Wikidata'da doğru

### Developer & Tech Community Otoritesi
- [ ] GitHub presence (public repo veya org sayfası)
- [ ] GitHub README detaylı ve schema-friendly
- [ ] ProductHunt launch yapılmış
- [ ] HackerNews "Show HN" post
- [ ] Dev.to / Hashnode teknik blog içerikleri
- [ ] Stack Overflow tag veya sorular
- [ ] NPM/PyPI package (varsa) açıklamaları optimize

### Review Platformları
- [ ] G2 profili tamamlanmış (tüm alanlar dolu)
- [ ] Capterra profili aktif
- [ ] Trustpilot profili
- [ ] GetApp profili
- [ ] Clutch (B2B ise) profili
- [ ] Review'lara sistematik yanıt veriliyor

### Media & PR
- [ ] TechCrunch / VentureBeat / Wired mention
- [ ] Sektörel blog ve newsletter'larda yer alma
- [ ] Podcast konuklukları (niche SaaS podcastleri)
- [ ] HARO / Qwoted ile journalist query yanıtları

### Comparison & Alternative Sayfaları
- [ ] `/vs/competitor-name` sayfaları oluşturulmuş
- [ ] `/alternatives` sayfası
- [ ] `/reviews` sayfası
- [ ] Her karşılaştırma sayfasında yapılandırılmış data

---

## FAZ 3 — İçerik Stratejisi (1-3 Ay)

### Answer-First İçerik
- [ ] "What is [category]?" sorusunu ilk paragrafta yanıtlıyor
- [ ] "Best [category] tool for [ICP]" sorgusuna net cevap
- [ ] Her feature sayfası: problem → çözüm → nasıl çalışır yapısında
- [ ] Pricing sayfası: "Is [tool] worth it?" sorusunu yanıtlıyor
- [ ] Use case sayfaları: sektöre/role göre ayrılmış

### Topical Authority
- [ ] Her integration için ayrı içerik sayfası
- [ ] Her kullanım senaryosu için ayrı sayfa
- [ ] Rakip karşılaştırma içerikleri (tarafsız, veriye dayalı)
- [ ] Sektör glossary sayfaları
- [ ] "How to [achieve goal] with [tool]" serisi
- [ ] Template library (kullanıcılar için)
- [ ] Case study sayfaları (metrics ile)

### AI Citation Stratejisi
- [ ] HARO ile aktif citation kazanımı
- [ ] Reddit: niche subreddit'lerde genuine katılım
  - r/SaaS, r/startups, r/[niche]
- [ ] Quora: ürünle ilgili sorulara detaylı yanıtlar
- [ ] LinkedIn Pulse makaleleri
- [ ] Guest post: authority SaaS blogları
- [ ] "State of [industry]" araştırma raporu yayınla

### Developer Content (Varsa API/Integration)
- [ ] API documentation AI-readable format
- [ ] Code examples her endpoint için
- [ ] SDK documentation
- [ ] Webhook dokümantasyonu
- [ ] "Build with [tool]" tutorial serisi

---

## FAZ 4 — Ölçüm & İzleme (Sürekli)

### Araçlar
- [ ] Google Search Console
- [ ] Ahrefs / Semrush (karşılaştırma keyword'leri takibi)
- [ ] G2 Review Dashboard
- [ ] Genessa AI mention tracker (haftalık)
- [ ] Brand24 / Mention (sosyal dinleme)
- [ ] Churnkey / Baremetrics (churn analizi — UX sinyali)

### AI Citation Kontrolü (Haftalık)
- [ ] ChatGPT: "Best [category] tools" → ürün çıkıyor mu?
- [ ] Perplexity: "[Tool] vs [competitor]" → nasıl değerlendiriliyor?
- [ ] Claude: "[Problem] için hangi araç?" → öneriliyor mu?
- [ ] Google AI Overview: brand keyword'lerde görünüyor mu?
- [ ] Gemini: sektör soruları → mention var mı?

### Haftalık Görev Kategorileri
- **Hafta 1-2:** Schema + llms.txt + docs audit
- **Hafta 3-4:** Review platform güncellemeleri + Wikidata
- **Ay 2:** Karşılaştırma sayfaları + Reddit varlığı
- **Ay 3:** Case study + araştırma raporu + PR outreach
- **Devam:** Haftalık AI citation kontrolü + aylık içerik

---

## Danışmanlık Süresi ve Plan

| Dönem | Odak | Hedef Skor |
|-------|------|------------|
| 1. Ay | Kritik teknik + schema + llms.txt | AI Readiness: 70+ |
| 2. Ay | Entity authority + review platformları | Authority: 60+ |
| 3. Ay | Karşılaştırma içerikleri + AI citation | Influence: başlangıç |
| 6. Ay | Topical authority + PR | Tüm skorlar 80+ |
| Sürekli | Haftalık izleme + optimizasyon | Rakipleri geçmek |

---

## SaaS İçin Özel AI Prompt Seti

Genessa'nın bu vertical'de analiz yaparken kullandığı lens:

> "Bu SaaS ürününün documentation kalitesi, karşılaştırma sayfaları,  
> review platform varlığı ve developer community otoritesi nedir?  
> ChatGPT ve Perplexity bu ürünü rakiplerine kıyasla nasıl konumlandırır?  
> Hangi sorgularda önerilmeli, hangilerde şu an eksik?"
