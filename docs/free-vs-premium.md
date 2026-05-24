# GENESSA — FREE vs PREMIUM

## Temel Kural
Free scan = wow etkisi + "problemim varmış" hissi + lead capture.
Premium = intelligence + tracking + tam analiz.
Free asla yeterli olmamalı ama asla hayal kırıklığı da yaratmamalı.

---

## Scan Limit Kuralı

### Free Kullanıcı
- Domain başına 7 günde 1 scan (hesap bazlı değil, DOMAIN bazlı)
- Aynı domain 7 gün içinde tekrar taranırsa: "Cached result" göster + "Rescan available in X days"
- Email olmadan: 1 scan/gün (IP bazlı, soft limit)
- Email ile kayıt: domain başına 7 günde 1 (daha güvenilir tracking)

### Neden Domain Bazlı?
- Hesap bazlı olsaydı: yeni hesap açarlar
- IP bazlı olsaydı: VPN ile aşarlar
- Domain bazlı: kendi siteni taratıyorsun, domain senin, limit anlamlı

### Premium Kullanıcı
- Sınırsız rescan
- Tüm geçmiş scanler kaydedilir
- Haftada 1 otomatik AI mention check (async)
- Birden fazla domain (plan'a göre)

---

## Free Scan'de Gösterilenler

### Göster
- [ ] AI Readiness Score (tam — tüm 9 check)
- [ ] AI Authority Score (sadece sayı + 2 bullet: strongest + critical gap)
- [ ] AI Influence Score (sayı göster ama "??" veya lock icon)
- [ ] Hero insight cümlesi (LLM çağrısı, cached)
- [ ] "Fix now — earn +X points" bölümü (max 4 kritik eksik)
- [ ] Score breakdown tablosu (tüm checkler, pass/fail/partial)
- [ ] 2 insight bloğu (strongest_point + critical_gap)

### Gösterme / Kilitle
- [ ] AI Authority Score detayı (sadece sayı görünür)
- [ ] AI Influence Score detayı (kilitli)
- [ ] AI mention tracking sonuçları
- [ ] Recommendation likelihood analizi
- [ ] Competitor comparison
- [ ] Page-level analysis (homepage only, diğerleri kilitli)
- [ ] Historical trend
- [ ] Authority narrative (3 paragraf)
- [ ] Full insight blokları (6/6 yerine 2/6)
- [ ] PDF export
- [ ] Action checklist (sadece ilk 3 öneri)
- [ ] 30/60/90 gün roadmap

---

## Premium CTA Yerleşimi

### Yeri 1 — AI Authority Score altında
```
AI Authority: 52/100
[strongest_point bullet]
[critical_gap bullet]
━━━━━━━━━━━━━━━━━━━━━━━━
🔒 Full authority analysis →  [Upgrade]
```

### Yeri 2 — AI Influence Score alanı (sağ panel)
```
AI Influence Score
━━━━━━━━━━━━━━━━━━
[Lock icon]
"See where AI systems mention your brand
across ChatGPT, Perplexity, Claude and
Google AI Overviews."

We ask AI questions in your niche weekly
and track whether your brand appears.

[Get full report →]
```

**DİKKAT:** Bu alanda "real-time monitoring" veya "live tracking" ifadesi kullanma.
Doğru ifade: "We ask AI systems questions in your niche and track results."

### Yeri 3 — Score breakdown sonunda
```
Want deeper intelligence?
See competitor gaps, authority roadmap,
and AI recommendation analysis.
[Unlock premium analysis →]
```

---

## Free → Premium Conversion Mantığı

### En iyi conversion tetikleyiciler (sırayla)
1. AI Influence Score lock (merak + FOMO)
2. Competitor adı görünür ama detay kilitli (faz 3)
3. "+40 puan kazanabilirsin" → "Nasıl?" → premium
4. Insight blokları 2/6 görünür → "4 more insights unlocked with premium"
5. Rescan bloğu → "Rescan available in 6 days — or upgrade for instant rescan"

### Email Capture (free scan sonrası)
Scan sonuçları göster → email sor → email olmadan da 1 kez izin ver.
Mesaj: "Save your results and track improvements over time."
Email SONRA iste, ÖNCE değil. Önce value ver.

---

## Plan Yapısı (önerim)

| Plan | Fiyat | İçerik |
|------|-------|--------|
| Free | $0 | 1 domain, 7 günde 1 scan, Readiness + teaser |
| Starter | $19/ay | 1 domain, sınırsız rescan, tüm skorlar, history |
| Pro | $49/ay | 3 domain, AI mention weekly, competitor (faz 3) |
| Agency | $149/ay | 10 domain, client reports, PDF export, white-label |

**NOT:** Fiyatlar taslak. Billing-flow.md'de Stripe entegrasyonu ayrıca ele alınır.

---

## Scan Sonuç Sayfası Yapısı (Free)

```
┌────────────────────────────────────────────────────────┐
│  [Domain pill]                              [Re-scan]  │
│                                                        │
│  AI VISIBILITY SCORE                                   │
│  [hero insight cümlesi — LLM generated]                │
│                                                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │
│  │ Readiness   │ │ Authority   │ │ Influence   │     │
│  │   68/100    │ │   52/100    │ │   🔒        │     │
│  └─────────────┘ └─────────────┘ └─────────────┘     │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ⚠ Fix now — earn +40 points      [4 critical]   │ │
│  │  +15 Add JSON-LD...                              │ │
│  │  +15 Add answer-first content...                 │ │
│  │  +5  Add entity links...                         │ │
│  │  +5  Add article:published_time...               │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Score breakdown (9 checks)          [Authority panel] │
│  [Check tablosu]                     [Influence lock]  │
│                                                        │
│  Insights (2/6)                                        │
│  ✓ Strongest point...                                  │
│  ✗ Critical gap...                                     │
│  [🔒 4 more insights — Upgrade]                       │
└────────────────────────────────────────────────────────┘
```
