# Genessa — Vertical AI Operating Systems
## Master Architecture Document

---

## Vizyon

Genessa bir "AI visibility tool" değil.  
Genessa, sektöre özel **AI Visibility Operations Platform**'dur.

GStack nasıl software ekipleri için bir "komut sistemi" ise —  
Genessa da işletmeler için bir **business growth komut sistemi**dir.

Fark şu:
- GStack → software workflow (plan, review, qa, ship)
- Genessa → business growth workflow (analiz, otorite, içerik, izleme)

Her vertical için ayrı bir Agent OS çalışır:
- Farklı analiz kriterleri
- Farklı sistem promptu
- Farklı rapor dili ve öneri yapısı
- Farklı scoring ağırlıkları
- Farklı aksiyon planı

Kullanıcı "AI visibility nedir?" anlamak zorunda kalmaz.  
Kullanıcı şunu anlar: **"Benim sektörümden anlayan AI danışmanım var."**

---

## Vertical Yapısı

```
agents/
  hospitality/
    restaurant-agent.md
    hotel-agent.md
    villa-agent.md

  health/
    clinic-agent.md
    ivf-agent.md
    dental-agent.md

  education/
    edu-agent.md
    bootcamp-agent.md

  commerce/
    ecommerce-agent.md
    saas-agent.md

  professional/
    legal-agent.md
    finance-agent.md

  creator/
    personalbrand-agent.md
```

---

## Multi-Agent Chain Mimarisi

Genessa'nın asıl gücü: kullanıcı tek butona basar,  
arka planda birden fazla uzman agent paralel çalışır.

### Örnek: `/restaurant-growth-audit`

```
Kullanıcı: "Restaurant analizi yap"
                    ↓
           Orchestrator Agent
     (hangi agent'ları çağıracağına karar verir)
                    ↓
    ┌───────────────────────────────┐
    │                               │
Local SEO       AI Visibility    Content
  Agent            Agent           Agent
    │                               │
    └──────────────┬────────────────┘
                   ↓
          Reputation      Conversion
            Agent           Agent
                   ↓
          Sonuçları birleştir
                   ↓
          Dashboard'a yaz
```

**Sonuç:** Tek rapor, 6 uzmanın gözünden.

### Diğer Audit Komutları (İleride)

| Komut | Çalışan Agent'lar |
|-------|-------------------|
| `/restaurant-growth-audit` | Local SEO + AI Visibility + Content + Reputation + Conversion |
| `/clinic-trust-audit` | Medical Authority + Trust Signals + Patient Journey + AI Citation |
| `/saas-discovery-audit` | Documentation + Comparison Pages + Dev Community + AI Citation |
| `/hotel-booking-audit` | OTA Optimization + Local Authority + Experience Content + Review |
| `/creator-visibility-audit` | Personal Brand + Thought Leadership + Platform Presence + Citation |

---

## Agent Sistem Prompt Yapısı

Her agent dosyası şu yapıyı içerir:

```markdown
# [Sektör] Agent OS

You are a [sektör] growth strategist specialized in:
- AI Visibility
- [Sektöre özel kanallar]
- [Sektöre özel metrikler]

Your goal:
[Sektöre özel büyüme hedefi]

When analyzing, always prioritize:
1. [En kritik sinyal]
2. [İkinci kritik sinyal]
3. [Üçüncü kritik sinyal]

Report language:
[Sektörün kendi dili — "hasta" değil "müşteri" değil]
```

---

## Core Scoring Engine (Tüm Vertical'lerde Ortak)

Her agent aynı 3 temel skoru üretir, ağırlıklar sektöre göre değişir:

| Skor | Açıklama |
|------|----------|
| **AI Readiness** | Teknik altyapı, schema, llms.txt, robots.txt |
| **Authority** | Entity otoritesi, Wikidata, backlink kalitesi |
| **Influence** | AI sistemlerinde kaç kez öneriliyorsun (kilitli) |

### Scoring Ağırlıkları (Sektöre Göre)

| Vertical | Readiness | Authority | Influence |
|----------|-----------|-----------|-----------|
| SaaS | %30 | %30 | %40 |
| Clinic | %35 | %45 | %20 |
| Restaurant | %40 | %25 | %35 |
| Education | %35 | %40 | %25 |
| Creator | %25 | %20 | %55 |
| E-commerce | %40 | %35 | %25 |
| Hotel | %35 | %35 | %30 |
| Legal | %30 | %50 | %20 |

---

## Orchestrator Agent

Tüm vertical audit'lerin üstünde bir **Orchestrator** çalışır:

**Görevi:**
1. Kullanıcının sektörünü ve talebini anla
2. Hangi sub-agent'ların çalışacağına karar ver
3. Agent'ların çıktılarını doğru sırada birleştir
4. Çelişen sinyalleri çöz (örn: teknik iyi ama içerik zayıf)
5. Tek, tutarlı aksiyon planı üret

**Orchestrator sistem promptu (özet):**
```
You are the Genessa Orchestrator.
You coordinate specialist agents to produce a unified growth audit.
You decide which agents to run based on sector and user goal.
You synthesize all outputs into one prioritized action plan.
Never show raw agent outputs — always synthesize.
```

---

## Rapor Katmanı

Her agent kendi dilinde rapor üretir:

- **Restaurant:** "Google'da görünürlük, TripAdvisor mention, rezervasyon funnel"
- **Clinic:** "Medikal authority, hasta acquisition, güven sinyalleri"
- **SaaS:** "AI citation, karşılaştırma keyword'leri, documentation kalitesi"
- **Hotel:** "OTA bağımlılığı, direkt rezervasyon oranı, deneyim içeriği"
- **Creator:** "Thought leadership skoru, platform varlığı, AI önerilirlik"
- **Legal:** "E-E-A-T sinyalleri, baro otoritesi, uluslararası görünürlük"

---

## FAZ Yapısı (Her Agent'ta Ortak)

Her agent kendi sektörüne göre bu 4 fazı uygular:

| FAZ | Odak | Süre |
|-----|------|------|
| FAZ 1 | Kritik Teknik Altyapı | 1-2 Hafta |
| FAZ 2 | Entity Otoritesi & Güven | 1 Ay |
| FAZ 3 | İçerik & Citation Stratejisi | 1-3 Ay |
| FAZ 4 | Sürekli Ölçüm & İzleme | Devam |

---

## Ürün Yol Haritası

### Faz 1 — Core Platform (Şu An)
- ✅ AI Readiness / Authority / Influence skorları
- ✅ Auth sistemi (email + Google)
- ✅ Dashboard
- ✅ Agent OS dokümantasyonu

### Faz 2 — Vertical Launch
- Sector selection onboarding
- Her vertical için özel dashboard dili
- Sektöre özel checklist ve aksiyon planı
- Agent sistem promptları backend'e entegre

### Faz 3 — Multi-Agent Audit
- `/[sector]-growth-audit` komutları
- Orchestrator agent aktif
- Paralel agent çalışması
- Birleşik rapor outputu

### Faz 4 — Vertical Ürünler
- "Genessa for Clinics"
- "Genessa for SaaS"
- "Genessa for Hospitality"
- Ayrı landing page, pricing, sales funnel

### Faz 5 — Platform
- Agency dashboard (birden fazla müşteriyi yönet)
- White-label seçeneği
- API erişimi
- Partner network

---

## Yatırımcı Konumlandırması

> "Genessa is not an AI visibility tool.  
> Genessa is a Vertical AI Operating System for business growth.  
> Each industry gets its own AI agent team —  
> built for their language, channels, metrics, and growth model.  
> One button. Six specialists. One action plan."

**Neden şimdi:**
- AI search adoption → exponential
- Her sektör "AI'da görünmek" istiyor ama nasıl yapacağını bilmiyor
- Vertical SaaS en hızlı büyüyen kategori
- "AI consulting OS" kategorisi henüz tanımlanmadı

**TAM (Total Addressable Market):**
- Medical tourism: $14B+
- SaaS: sonsuz
- Education: $350B+ globally
- Legal: $1T+ globally
- E-commerce: $6T+ globally

---

## Pricing Yapısı (Vertical Bazlı)

| Plan | Fiyat | Kapsam |
|------|-------|--------|
| Starter | $49/ay | 1 domain, temel skor, aylık rapor |
| Growth | $149/ay | 3 domain, tüm skorlar, haftalık izleme |
| Pro | $349/ay | 10 domain, AI mention takibi, priority support |
| Agency | $999/ay | Sınırsız domain, white-label, API |

*Clinic / Medical Tourism / Legal vertical'leri için enterprise tier ayrıca fiyatlandırılır.*
