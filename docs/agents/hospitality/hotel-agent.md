# Hospitality Agent OS
## Genessa Vertical Intelligence — Hotel, Villa, Resort & Boutique Stays

> **Hedef:** Oteli, villaları veya resortı AI sistemlerinin "en iyi butik otel Bodrum",  
> "luxury villa Kaş" gibi sorgularda önerdiği, Booking/Airbnb dışında  
> doğrudan rezervasyona yönlendiren bir marka haline getirmek.

---

## Sektör Profili

**Neden kritik:**
- "Where should I stay in Bodrum?" artık ChatGPT'de soruluyor
- AI travel assistants (Perplexity, Google AI) doğrudan otel önerisi yapıyor
- OTA bağımlılığını azaltmak için direkt AI visibility şart
- Luxury segment'te araştırma tamamen dijital
- Dubai, Maldives, Türkiye coast → international turist AI ile karar veriyor

**Scoring Ağırlıkları:**
- AI Readiness: %35
- Authority: %35
- Influence: %30

**Temel Segmentler:**
- Butik oteller
- Lüks villalar (villa kiralama)
- Resort & spa
- Glamping / eco-stay
- Airbnb management şirketleri
- Boutique hotel groups

---

## FAZ 1 — Kritik Teknik Altyapı (1-2 Hafta)

### Schema.org
- [ ] `Hotel` veya `LodgingBusiness` schema
- [ ] `name`, `address`, `geo` (koordinatlar) dolu
- [ ] `priceRange` belirtilmiş
- [ ] `amenityFeature` listesi (havuz, spa, deniz manzarası, vs)
- [ ] `aggregateRating` (Booking, TripAdvisor, Google)
- [ ] `Review` schema en iyi yorumlar için
- [ ] `Room` schema oda tipleri için
- [ ] `FAQPage` schema (check-in, politikalar, ulaşım)
- [ ] `Event` schema (düğün, özel etkinlik varsa)
- [ ] `BreadcrumbList` tüm sayfalarda
- [ ] `ImageObject` tüm fotoğraflar için

### llms.txt
- [ ] `/llms.txt` oluşturulmuş
- [ ] Mülkün kim için ideal olduğu net tanımlanmış
  - "Honeymoon couples seeking private pool villas in Bodrum"
  - "Corporate groups for off-site retreats"
- [ ] Oda/villa tipleri ve kapasiteler
- [ ] Öne çıkan özellikler (private beach, infinity pool, etc.)
- [ ] Fiyat aralığı (sezon bazlı)
- [ ] Yakın lokasyonlar ve mesafeler
- [ ] Direkt rezervasyon avantajları
- [ ] Diller: EN, DE, RU, AR (pazar bazlı)

### Robots.txt
- [ ] GPTBot: Allow
- [ ] ClaudeBot: Allow
- [ ] PerplexityBot: Allow
- [ ] Google-Extended: Allow
- [ ] Applebot: Allow

### Teknik Altyapı
- [ ] Core Web Vitals geçiyor
- [ ] Mobil optimizasyon (seyahat araştırması %85 mobil)
- [ ] Sayfa hızı < 2.5 saniye (görseller ağır olduğu için kritik)
- [ ] Rezervasyon motoru entegreli ve hızlı
- [ ] Canonical URL'ler doğru
- [ ] Google Maps embed

---

## FAZ 2 — Otorite & Güven (1 Ay)

### Wikidata / Wikipedia
- [ ] Wikidata'ya mülk kaydı (büyük otel/resortlar için)
- [ ] `instance of: hotel`
- [ ] Lokasyon, yıldız sayısı, oda sayısı
- [ ] `sameAs`: Booking.com, TripAdvisor, Google Business

### OTA & Listing Optimizasyonu
- [ ] Booking.com profili tam optimize
  - Açıklama AI-friendly rewrite
  - Tüm kategoriler dolu
  - Fotoğraflar etiketlenmiş
- [ ] TripAdvisor listing optimize
- [ ] Airbnb profili (uygunsa)
- [ ] Google Travel / Google Hotels aktif
- [ ] Expedia / Hotels.com profil
- [ ] Luxury segment: Mr & Mrs Smith, Secret Escapes, i-escape

### Google Business Profile
- [ ] Profil %100 dolu
- [ ] 500+ kelime açıklama
- [ ] Tüm özellikler işaretlenmiş
- [ ] Fotoğraflar her kategori için (oda, havuz, yemek, view)
- [ ] Posts düzenli (haftalık)
- [ ] Q&A yanıtlanmış
- [ ] Yorumlara düzenli yanıt

### Media & PR
- [ ] Condé Nast Traveller / Travel + Leisure mention
- [ ] Seyahat blogları (DA 50+) misafir yazısı veya review
- [ ] Instagram influencer işbirlikleri (UGC)
- [ ] Tatil.com / Tur.com gibi TR platformlarda içerik
- [ ] Düğün platformları (Bridestory, düğün.com) — varsa

---

## FAZ 3 — İçerik Stratejisi (1-3 Ay)

### Answer-First İçerik
- [ ] "Best luxury hotels Bodrum 2024" → neden bu otel?
- [ ] "Private villa with pool Turkey" → doğrudan yanıt
- [ ] "Honeymoon destination Aegean" → öneride yer alma
- [ ] Her oda/villa türü için ayrı içerik sayfası
- [ ] "Things to do near [hotel name]" rehber sayfası

### Deneyim Sayfaları
- [ ] Her deneyim için ayrı sayfa:
  - Sunset dinner
  - Private yacht tour
  - Spa & wellness
  - Wedding packages
- [ ] Her sayfa için `Event` veya `TouristAttraction` schema
- [ ] Video içerik (drone, interior tour)

### Seyahat Rehberi İçerikleri
- [ ] "[Şehir/Bölge] gezi rehberi" — otelden perspektif
- [ ] "Bodrum'da ne yapılır?" — otel konumuyla entegre
- [ ] "En iyi restoranlar yakın" — partnership içerikleri
- [ ] Sezon rehberleri (yaz/kış önerileri)

### Sosyal Kanıt İçeriği
- [ ] Video testimonial'lar (YouTube + site)
- [ ] Before/after renovasyon içeriği (varsa)
- [ ] "As seen in" medya logoları
- [ ] Misafir hikayeleri (izinli UGC)

### Mention & Citation Stratejisi
- [ ] TripAdvisor review yanıtları (AI signal)
- [ ] Seyahat forumları: TripAdvisor, Lonely Planet, Reddit r/travel
- [ ] Luxury travel Facebook grupları
- [ ] Expat toplulukları (Türkiye'de yaşayan yabancılar)

---

## FAZ 4 — Ölçüm & İzleme (Sürekli)

### Araçlar
- [ ] Google Search Console
- [ ] Google Business Profile Insights
- [ ] TripAdvisor Management Dashboard
- [ ] Genessa AI mention tracker (haftalık)
- [ ] Rate Gain / OTA Insight (OTA performans)

### AI Citation Kontrolü (Haftalık)
- [ ] ChatGPT: "Best boutique hotel Bodrum" → çıkıyor mu?
- [ ] Perplexity: "Luxury villa Turkey private pool" → mention var mı?
- [ ] Claude: "Honeymoon Aegean stay" → önerildi mi?
- [ ] Google AI Overview: otel adı / lokasyon sorguları
- [ ] Gemini Travel: destinasyon sorguları

### Revenue Metrikleri
- [ ] Direkt rezervasyon oranı (OTA'ya kıyasla)
- [ ] AI kanalından gelen trafik (UTM ile izle)
- [ ] Organik → rezervasyon conversion
- [ ] Ortalama rezervasyon değeri (kanal bazlı)
- [ ] RevPAR (Revenue per Available Room)

### Haftalık Görev Kategorileri
- **Hafta 1-2:** Schema + llms.txt + Google Business
- **Hafta 3-4:** OTA profil optimizasyonu + fotoğraf audit
- **Ay 2:** İçerik sayfaları + deneyim sayfaları
- **Ay 3:** PR + blogger outreach + influencer
- **Devam:** Haftalık yorum yanıtları + AI citation kontrolü

---

## Danışmanlık Süresi ve Plan

| Dönem | Odak | Hedef |
|-------|------|-------|
| 1. Ay | Teknik altyapı + OTA optimizasyon | Readiness: 75+ |
| 2. Ay | Google Business + içerik sayfaları | Authority: 65+ |
| 3. Ay | PR + influencer + AI citation | İlk AI mention'lar |
| 6. Ay | Direkt rezervasyon artışı | OTA bağımlılığı -%20 |
| Sürekli | Sezonsal içerik + izleme | Rakipleri geçmek |

---

## Hospitality İçin Özel AI Prompt Seti

> "Bu otel veya villa, seyahat planı yapan biri ChatGPT'de sorduğunda önerilecek mi?  
> Lokasyon otoritesi, misafir deneyimi içeriği ve OTA varlığı  
> AI seyahat önerilerini nasıl etkiliyor?  
> 'Luxury stay [destination]' sorgusunda bu mülk nerede konumlanıyor?"
