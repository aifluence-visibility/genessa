# Real Estate Agent OS
## Genessa Vertical Intelligence — Luxury Property, Villa Sales & International Investment

> **Hedef:** Emlak firmasını AI sistemlerinin "buy property in Turkey",  
> "luxury villa Bodrum", "Dubai investment property" gibi sorgularda önerdiği,  
> uluslararası alıcı için güvenilir gayrimenkul otoritesi olarak tanıdığı marka yapmak.

---

## Sektör Profili

**Neden kritik:**
- "Best areas to buy property in Istanbul" → ChatGPT'de soruluyor
- Uluslararası yatırımcı araştırması tamamen dijital
- AI, bölge karşılaştırması ve ROI analizi yapıyor
- Lüks segment'te alıcı ortalama 6+ ay dijital araştırıyor
- Lead değeri çok yüksek → 1 AI referral = milyonluk işlem

**Scoring Ağırlıkları:**
- AI Readiness: %30
- Authority (güven + uzmanlık): %45
- Influence: %25

**Temel Segmentler:**
- Lüks konut projeleri (yeni geliştirme)
- Villa satış ve kiralama (Bodrum, Kaş, Alaçatı)
- Dubai / BAE yatırım danışmanlığı
- Uluslararası alıcıya yönelik gayrimenkul
- Ticari gayrimenkul
- Property management şirketleri
- Vatandaşlık yatırım programları (CBI)

---

## FAZ 1 — Kritik Teknik Altyapı (1-2 Hafta)

### Schema.org
- [ ] `RealEstateAgent` schema ana sayfada
- [ ] `Organization` schema (firma için)
- [ ] `RealEstateListing` her ilan için
  - `name`, `description`, `address`
  - `floorSize`, `numberOfRooms`
  - `offers` (fiyat, para birimi)
  - `geo` koordinatlar
  - `image` birden fazla fotoğraf
- [ ] `Person` schema danışmanlar için
- [ ] `FAQPage` schema (satın alma süreci, tapu, vize, vergi)
- [ ] `Review` schema müşteri yorumları
- [ ] `BreadcrumbList`
- [ ] `LocalBusiness` + coğrafi hizmet alanı

### llms.txt
- [ ] `/llms.txt` oluşturulmuş
- [ ] Firma uzmanlık alanı net
  - "Luxury villa sales and investment advisory in Bodrum Peninsula and Istanbul"
- [ ] Hizmet verilen bölgeler
- [ ] Tipik müşteri profili (Arap yatırımcı, Avrupalı alıcı vs)
- [ ] Fiyat aralıkları (genel)
- [ ] Satın alma süreci özeti (yabancılar için)
- [ ] Vatandaşlık yatırım programı bilgisi (varsa)
- [ ] Dil kapasitesi (EN, AR, RU, DE kritik)

### Robots.txt
- [ ] Tüm AI botları: Allow
- [ ] İlan sayfaları tam indexlenebilir

### Çok Dilli Altyapı
- [ ] EN (zorunlu — uluslararası alıcı)
- [ ] AR (Orta Doğu yatırımcı — büyük pazar)
- [ ] RU (Rus/CIS alıcı)
- [ ] DE (Alman alıcı — Ege kıyısı için büyük)
- [ ] Her dilde satın alma rehberi

### Teknik Altyapı
- [ ] Core Web Vitals
- [ ] Yüksek kaliteli fotoğraf yüklemesi hızlı
- [ ] 360° sanal tur entegrasyonu (varsa)
- [ ] Harita tabanlı arama / listeleme
- [ ] WhatsApp butonu her sayfada
- [ ] Currency converter widget (USD/EUR/GBP/AED)

---

## FAZ 2 — Güven & Otorite (1 Ay)

### Lisans & Akreditasyon Sinyalleri
- [ ] TÜRSAB lisansı (varsa)
- [ ] Gayrimenkul lisansı / ruhsat sayfada görünür
- [ ] Uluslararası üyelikler
  - FIABCI (uluslararası emlak federasyonu)
  - NAR (National Association of Realtors) — uygunsa
  - RICS üyeliği (değerleme için güçlü sinyal)
- [ ] Ödüller ve tanınırlıklar
- [ ] Banka ve finans ortaklıkları (güven sinyali)

### Danışman Profil Sayfaları
- [ ] Her danışman için ayrı sayfa
- [ ] Profesyonel fotoğraf
- [ ] Uzmanlık bölgesi ve ürün tipi
- [ ] Başarıyla tamamlanan işlem sayısı
- [ ] Dil kapasitesi
- [ ] Müşteri referansları (anonymized veya izinli)
- [ ] LinkedIn bağlantısı

### Wikidata / Wikipedia
- [ ] Büyük firmalar için Wikidata kaydı
- [ ] `instance of: real estate agency`
- [ ] Hizmet bölgeleri, kuruluş yılı

### Review & Listing Platformları
- [ ] Google Business Profile tam optimize
- [ ] Trustpilot profili
- [ ] Bayut / Dubizzle (Dubai için)
- [ ] Sahibinden.com (Türkiye için)
- [ ] JamesEdition (lüks segment için)
- [ ] Rightmove / Zoopla Overseas
- [ ] Spot Blue / A Place in the Sun (İngiliz alıcı)

### Media & PR
- [ ] Forbes Real Estate / Mansion Global
- [ ] Seyahat + lifestyle medyasında bölge içerikleri
- [ ] Uluslararası yatırım medyasında yer alma
- [ ] Podcast: expat ve yatırım podcastleri konukluk
- [ ] HARO: emlak, yatırım, expat yaşam kategorileri

---

## FAZ 3 — İçerik Stratejisi (1-3 Ay)

### Answer-First İçerik
- [ ] "Can foreigners buy property in Turkey?" → net rehber
- [ ] "Best areas to invest in Istanbul 2024" → bölge analizi
- [ ] "Cost of buying property in Bodrum" → tam maliyet dökümü
- [ ] "Turkish citizenship by investment" → süreç rehberi
- [ ] "ROI on rental property in Turkey" → veri destekli analiz

### Bölge Rehberleri
- [ ] Her hizmet bölgesi için kapsamlı rehber
  - "[Bölge] yaşam rehberi" (expat gözünden)
  - "[Bölge] yatırım analizi" (fiyat trendleri, ROI)
  - "[Bölge] en iyi mahalleler" (alıcı tipine göre)
- [ ] Bölge karşılaştırma içerikleri
  - "Bodrum vs Alaçatı — hangisi daha iyi yatırım?"
  - "Istanbul Asya vs Avrupa yakası"

### Satın Alma Rehberleri
- [ ] "Yabancı olarak Türkiye'de mülk alma" adım adım
- [ ] Tapu süreci rehberi
- [ ] Vergi ve masraflar rehberi
- [ ] Mortgage / finansman seçenekleri
- [ ] Property management bilgisi
- [ ] Kiralama potansiyeli hesaplama rehberi

### Pazar Analizi İçerikleri
- [ ] Yıllık/çeyreklik piyasa raporu yayınla
- [ ] Fiyat endeksi takibi (bölge bazlı)
- [ ] "State of luxury real estate [city/region]" raporu
- [ ] Yabancı yatırımcı trendleri analizi

### Citation Stratejisi
- [ ] Reddit: r/expats, r/Turkey, r/dubai, r/financialindependence
- [ ] Expat Facebook grupları (Türkiye'de yabancılar)
- [ ] Quora: Türkiye'de mülk alma soruları
- [ ] YouTube: bölge tanıtım videoları
- [ ] LinkedIn: yatırım analizi makaleleri

---

## FAZ 4 — Ölçüm & İzleme (Sürekli)

### AI Citation Kontrolü (Haftalık)
- [ ] ChatGPT: "Buy property Istanbul" → firma çıkıyor mu?
- [ ] Perplexity: "Luxury villa Bodrum" → mention var mı?
- [ ] Claude: "Türkiye'ye yatırım" → önerildi mi?
- [ ] Google AI Overview: bölge + yatırım sorguları
- [ ] Gemini: "Best real estate [bölge]" → listede mi?

### Lead Metrikleri
- [ ] Organik lead → viewing → close oranı
- [ ] AI kanalından gelen sorgulamalar
- [ ] "How did you find us?" AI yanıtları
- [ ] Ülkelere göre lead kaynağı
- [ ] Ortalama işlem değeri (kanal bazlı)

### Haftalık Görev Kategorileri
- **Hafta 1-2:** Schema + llms.txt + danışman profilleri
- **Hafta 3-4:** Bölge rehberleri + çok dilli içerik
- **Ay 2:** Satın alma rehberleri + PR
- **Ay 3:** Pazar raporu yayınla + YouTube
- **Devam:** Haftalık AI citation + aylık piyasa güncellemesi

---

## Danışmanlık Süresi ve Plan

| Dönem | Odak | Hedef |
|-------|------|-------|
| 1. Ay | Teknik altyapı + danışman profilleri | Readiness: 70+ |
| 2. Ay | Bölge rehberleri + review platformları | Authority: 70+ |
| 3. Ay | Pazar raporu + PR | İlk AI mention'lar |
| 6. Ay | Uluslararası içerik + expat community | AI'dan ölçülebilir lead |
| Sürekli | Piyasa güncellemeleri + izleme | Bölgede referans firma |

---

## Multi-Agent Chain: Real Estate Growth Audit

`/realestate-growth-audit` çalıştırınca devreye giren agent'lar:

| Agent | Görev |
|-------|-------|
| **AI Visibility Agent** | Schema, llms.txt, teknik altyapı |
| **Regional Authority Agent** | Bölge içerikleri, piyasa analizi |
| **International Buyer Agent** | Çok dilli içerik, expat varlığı, yatırım rehberleri |
| **Trust Signals Agent** | Lisanslar, akreditasyon, danışman profilleri |
| **Reputation Agent** | Review platformları, müşteri yorumları |
| **Lead Conversion Agent** | CTA kalitesi, form optimizasyonu, WhatsApp funnel |

---

## Real Estate İçin Özel AI Prompt Seti

> "Bu emlak firması, Türkiye'de mülk almak isteyen yabancı bir alıcı  
> AI'a sorduğunda önerilecek mi?  
> Bölge uzmanlığı, güven sinyalleri ve uluslararası içerik  
> AI gayrimenkul önerilerini nasıl etkiliyor?  
> 'Buy luxury property [bölge]' sorgusunda bu firma nerede konumlanıyor?"
