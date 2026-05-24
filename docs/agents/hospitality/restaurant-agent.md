# Restaurant Agent OS
## Genessa Vertical Intelligence — Restaurant, Café & Food Business

> **Hedef:** Restoranı AI sistemlerinin "best restaurant [city]",  
> "romantic dinner Istanbul", "vegan restaurant Bodrum" gibi sorgularda önerdiği,  
> Google Maps ve TripAdvisor'ın ötesinde AI-first keşfedilen bir marka yapmak.

---

## Sektör Profili

**Neden kritik:**
- "Where should I eat in Istanbul?" → ChatGPT'de soruluyor
- AI travel asistanları doğrudan restoran önerisi yapıyor
- Google AI Overview yemek sorgularında aktif
- Turist kararlarının %60'ı dijital araştırmayla başlıyor
- Rezervasyon funnel'ı AI'dan başlayıp doğrudan kapanabiliyor

**Scoring Ağırlıkları:**
- AI Readiness: %40
- Authority: %25
- Influence: %35

**Temel Segmentler:**
- Fine dining restoranlar
- Casual dining zinciri ve tekil mekanlar
- Café ve brunch mekanları
- Fast casual / street food markalar
- Bar ve kokteyl mekanları
- Vegan / özel diyet restoranlar
- Ghost kitchen / delivery-only markalar

---

## FAZ 1 — Kritik Teknik Altyapı (1-2 Hafta)

### Schema.org
- [ ] `Restaurant` schema ana sayfada
- [ ] `name`, `address`, `geo` (koordinatlar) dolu
- [ ] `servesCuisine` tanımlanmış (Turkish, Italian, Vegan vs)
- [ ] `priceRange` belirtilmiş (€, €€, €€€)
- [ ] `openingHoursSpecification` tam dolu
- [ ] `hasMenu` → menü URL'i bağlı
- [ ] `aggregateRating` (Google, TripAdvisor, Yelp)
- [ ] `Review` schema öne çıkan yorumlar için
- [ ] `acceptsReservations` true/false
- [ ] `amenityFeature` (valet, outdoor seating, live music vs)
- [ ] `FAQPage` schema (rezervasyon, park, diyet seçenekleri)
- [ ] `Event` schema özel geceler / müzik etkinlikleri için
- [ ] `ImageObject` tüm yemek ve mekan fotoğrafları

### llms.txt
- [ ] `/llms.txt` oluşturulmuş
- [ ] Restoran konsepti 2-3 cümleyle net
  - "An intimate Aegean seafood restaurant in Karaköy with a focus on sustainable catches and natural wine."
- [ ] Mutfak tipi ve öne çıkan yemekler
- [ ] Kim için ideal (çift, iş yemeği, aile, turist vs)
- [ ] Fiyat aralığı
- [ ] Rezervasyon bilgisi
- [ ] Konum ve ulaşım
- [ ] Özel menü seçenekleri (vegan, gluten-free, halal)
- [ ] Diller: TR, EN (turist yoğunsa + DE, RU, AR)

### Robots.txt
- [ ] GPTBot: Allow
- [ ] ClaudeBot: Allow
- [ ] PerplexityBot: Allow
- [ ] Google-Extended: Allow
- [ ] Applebot: Allow

### Teknik Altyapı
- [ ] Core Web Vitals geçiyor
- [ ] Mobil optimize (yemek araştırması %90 mobil)
- [ ] Sayfa hızı < 2.5 saniye
- [ ] Online rezervasyon sistemi entegre ve hızlı
- [ ] Google Maps embed her sayfada
- [ ] Click-to-call telefon numarası
- [ ] Instagram feed embed (canlı içerik sinyali)

---

## FAZ 2 — Otorite & Güven (1 Ay)

### Google Business Profile (En Kritik)
- [ ] Profil %100 dolu
- [ ] 500+ kelime açıklama (keyword-rich)
- [ ] Tüm kategoriler seçilmiş (primary + secondary)
- [ ] Özellikler tam işaretlenmiş
  - Outdoor seating, Reservations, Delivery, Takeout vs
- [ ] Menü Google'a yüklü (ayrı bölüm)
- [ ] Fotoğraflar: yemek, iç mekan, dış mekan, ekip
  - Minimum 30 fotoğraf, her ay güncelleniyor
- [ ] Posts: haftada en az 1 (özel menü, etkinlik, saat değişikliği)
- [ ] Q&A tüm sorular yanıtlanmış
- [ ] Tüm yorumlara yanıt (hem + hem -)
- [ ] Rezervasyon linki eklenmiş

### TripAdvisor
- [ ] Profil tam dolu
- [ ] Tüm yorumlara yanıt verilmiş
- [ ] Fotoğraflar güncel
- [ ] Menü yüklenmiş
- [ ] TripAdvisor rezervasyon widget'ı entegre

### Wikidata
- [ ] Büyük/köklü restoranlar için kayıt
  - `instance of: restaurant`
  - Kuruluş yılı, mutfak tipi, lokasyon
- [ ] `sameAs`: TripAdvisor, Google Business, Instagram

### Diğer Listing Platformları
- [ ] Yelp profili (varsa)
- [ ] Zomato / Foursquare profili
- [ ] TheFork / OpenTable (rezervasyon)
- [ ] Restoran rehberleri (yerel yayınlar)
- [ ] Michelin Guide (varsa)

### Media & PR
- [ ] Yemek bloglarında review (DA 40+)
- [ ] Gastronomi dergilerinde yer alma
- [ ] Seyahat bloglarında "best restaurants" listelerine girme
- [ ] YouTube food vlogger işbirlikleri
- [ ] Yerel gazete / dergi içerikleri
- [ ] "As seen in" logolar sayfada

---

## FAZ 3 — İçerik Stratejisi (1-3 Ay)

### Answer-First İçerik
- [ ] "Best seafood restaurant Istanbul" → neden bu restoran?
- [ ] "Romantic dinner Bodrum" → deneyim tanımı ile yanıt
- [ ] "Vegan options [city]" → spesifik menü ile yanıt
- [ ] "Where to eat near [landmark]" → konum içeriği
- [ ] "Best [cuisine] in [city]" → category-specific içerik

### Deneyim Sayfaları
- [ ] Her özel deneyim için ayrı sayfa
  - Özel gün menüleri (yıldönümü, doğum günü)
  - Kurumsal yemek / business lunch
  - Tasting menu deneyimi
  - Brunch / Sunday special
- [ ] Her sayfa için `Event` veya `FoodService` schema

### Menü İçeriği
- [ ] Menü HTML olarak indexlenebilir (sadece PDF değil)
- [ ] Her imza yemek için açıklama + hikaye
- [ ] Malzeme kaynakları (yerel, sürdürülebilir ise öne çık)
- [ ] Sezonsal menü değişiklikleri güncelleniyor

### Seyahat & Keşif İçerikleri
- [ ] "[Mahalle] yemek rehberi" — restoranın bakış açısından
- [ ] "Istanbul'da [mutfak türü] nerede yenir?" rehberi
- [ ] Şef hikayesi / "Our story" sayfası (detaylı)
- [ ] Sürdürülebilirlik / yerel üretici hikayesi (varsa)

### Sosyal Medya & UGC
- [ ] Instagram: günlük yemek fotoğrafları + Reels
- [ ] TikTok: mutfak arkası, yemek hazırlık videoları
- [ ] UGC kampanyası: müşteri fotoğrafları repost (izinli)
- [ ] Hashtag stratejisi: marka + lokasyon + mutfak

### Mention & Citation Stratejisi
- [ ] Google Yorumlara sistematik yanıt (AI sinyali)
- [ ] TripAdvisor yorumlarına yanıt
- [ ] Reddit: r/istanbul, r/turkey, r/food ilgili thread'ler
- [ ] Expat toplulukları (yemek önerisi grupları)
- [ ] Seyahat forum'larında mention

---

## FAZ 4 — Ölçüm & İzleme (Sürekli)

### Araçlar
- [ ] Google Business Profile Insights
- [ ] Google Search Console
- [ ] TripAdvisor Management Dashboard
- [ ] Genessa AI mention tracker (haftalık)
- [ ] Instagram / TikTok Analytics
- [ ] Rezervasyon sistemi analytics

### AI Citation Kontrolü (Haftalık)
- [ ] ChatGPT: "Best restaurant [city/mahalle]" → çıkıyor mu?
- [ ] Perplexity: "[Mutfak] restaurant Istanbul" → mention var mı?
- [ ] Google AI Overview: restoran + lokasyon sorguları
- [ ] Claude: "Where to eat in [city]?" → önerildi mi?
- [ ] Gemini: "[Occasion] dinner [city]" → listede mi?

### İş Metrikleri
- [ ] Rezervasyon kaynak takibi (AI, Google, TripAdvisor)
- [ ] Walk-in vs rezervasyon oranı
- [ ] Ortalama masa doluluk oranı
- [ ] Google'dan click-to-call sayısı
- [ ] AI kanalından gelen rezervasyonlar (UTM)

### Haftalık Görev Kategorileri
- **Hafta 1-2:** Schema + llms.txt + Google Business optimize
- **Hafta 3-4:** TripAdvisor + fotoğraf güncellemesi
- **Ay 2:** Deneyim sayfaları + menü içeriği
- **Ay 3:** PR + food blogger outreach
- **Devam:** Haftalık yorum yanıtları + AI citation + sezonsal içerik

---

## Danışmanlık Süresi ve Plan

| Dönem | Odak | Hedef |
|-------|------|-------|
| 1. Ay | Google Business + schema + llms.txt | Readiness: 80+ |
| 2. Ay | TripAdvisor + fotoğraf + deneyim sayfaları | Authority: 65+ |
| 3. Ay | PR + food blogger + AI citation | İlk AI mention'lar |
| 6. Ay | Sezonsal içerik + influencer | AI'dan ölçülebilir rezervasyon |
| Sürekli | Haftalık içerik + izleme | Bölgede #1 AI önerisi |

---

## Multi-Agent Chain: Restaurant Growth Audit

`/restaurant-growth-audit` çalıştırınca devreye giren agent'lar:

| Agent | Görev |
|-------|-------|
| **AI Visibility Agent** | Schema, llms.txt, teknik altyapı |
| **Local SEO Agent** | Google Business, Maps, yerel arama |
| **Reputation Agent** | TripAdvisor, Google reviews, yanıt kalitesi |
| **Content Agent** | Menü içeriği, deneyim sayfaları, hikaye |
| **Social Presence Agent** | Instagram, TikTok, UGC varlığı |
| **Conversion Agent** | Rezervasyon funnel, CTA, mobil deneyim |

---

## Restaurant İçin Özel AI Prompt Seti

> "Bu restoran, yemek yeri arayan biri AI'a sorduğunda önerilecek mi?  
> Google Business kalitesi, TripAdvisor otoritesi ve içerik varlığı  
> AI yemek önerilerini nasıl etkiliyor?  
> 'Best [cuisine] restaurant [city]' sorgusunda bu mekan nerede konumlanıyor?"
