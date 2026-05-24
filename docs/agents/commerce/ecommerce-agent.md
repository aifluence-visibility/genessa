# E-Commerce Agent OS
## Genessa Vertical Intelligence — Shopify, DTC Brands & AI Shopping

> **Hedef:** E-ticaret markasını AI alışveriş asistanlarının  
> "best [product] under $X" veya "[problem] için hangi ürün?" sorgularında  
> önerdiği, güvenilir ve satın alınabilir kaynak olarak tanıdığı bir marka yapmak.

---

## Sektör Profili

**Neden kritik:**
- AI alışveriş patlıyor: ChatGPT Shopping, Perplexity Shopping, Google AI Shopping
- "Best running shoes for flat feet" → artık AI yanıtlıyor
- Product review kalitesi ve kaynak otoritesi AI kararını belirliyor
- DTC markalar Amazon bağımlılığından kurtulmak için AI visibility şart
- GEO (Generative Engine Optimization) = yeni SEO

**Scoring Ağırlıkları:**
- AI Readiness: %40
- Authority: %35
- Influence: %25

**Temel Segmentler:**
- Shopify DTC markalar
- Amazon satıcılar (marka sahibi)
- Niche ürün markaları
- Subscription box / kutu abonelik
- Handmade / artisan markalar (Etsy + kendi sitesi)
- B2B e-ticaret

---

## FAZ 1 — Kritik Teknik Altyapı (1-2 Hafta)

### Schema.org
- [ ] `Product` schema her ürün sayfasında
  - `name`, `description`, `image`, `brand`
  - `offers` (fiyat, stok, para birimi)
  - `aggregateRating` (yorum puanı)
  - `review` (öne çıkan yorumlar)
  - `sku`, `gtin` / `mpn`
- [ ] `Organization` / `Brand` schema
- [ ] `BreadcrumbList` tüm sayfalarda
- [ ] `FAQPage` schema (ürün sayfaları + SSS)
- [ ] `HowTo` schema (ürün kullanımı için)
- [ ] `ItemList` schema koleksiyon sayfaları için
- [ ] `Review` schema bağımsız review sayfaları için
- [ ] `WebSite` schema + Sitelinks Searchbox

### llms.txt
- [ ] `/llms.txt` oluşturulmuş
- [ ] Marka ne satıyor — net ve spesifik
- [ ] Kim için — ICP (ideal müşteri profili)
- [ ] En popüler ürün kategorileri
- [ ] Öne çıkan ürünler ve fiyat aralığı
- [ ] USP (neden bu marka?)
- [ ] Kargo, iade, garanti bilgisi
- [ ] Sustainability / etik üretim (varsa)

### Robots.txt
- [ ] GPTBot: Allow
- [ ] ClaudeBot: Allow
- [ ] PerplexityBot: Allow
- [ ] Google-Extended: Allow
- [ ] Applebot: Allow
- [ ] Googlebot-Image: Allow (görsel arama için kritik)

### Teknik E-ticaret Altyapı
- [ ] Core Web Vitals geçiyor
- [ ] Sayfa hızı < 2 saniye (conversion için kritik)
- [ ] Canonical URL'ler (variant sayfaları için özellikle)
- [ ] Faceted navigation yönetimi
- [ ] Structured data tüm ürünlerde
- [ ] Open Graph tüm ürün sayfaları için
- [ ] Sitemap: ürün + kategori + blog ayrı

### Ürün Sayfası Kalitesi
- [ ] Her ürün için 500+ kelime açıklama
- [ ] Ürün görselleri: çoklu açı, beyaz zemin, kullanım
- [ ] Video (varsa)
- [ ] Boyut/ölçü rehberi
- [ ] Malzeme/içerik detayı
- [ ] "Kimler için uygun" bölümü

---

## FAZ 2 — Marka Otoritesi (1 Ay)

### Wikidata / Wikipedia
- [ ] Büyük/köklü markalar için Wikidata kaydı
- [ ] `instance of: brand` veya `company`
- [ ] Kuruluş yılı, ürün kategorisi
- [ ] `sameAs`: Crunchbase, Amazon Brand Registry

### Review Ekosistemi
- [ ] Trustpilot profili aktif ve yorum toplanıyor
- [ ] Google Reviews optimize
- [ ] Yelpazede Sitejabber, Reviews.io
- [ ] Amazon reviews (satıcıysanız) temiz
- [ ] Yorum yanıtlama süreci tanımlanmış
- [ ] Review widget site içinde görünür
- [ ] UGC (user generated content) kampanyası

### Press & Media
- [ ] "As seen in" medya logolar sayfada
- [ ] PR list: lifestyle, niche, trade yayınlar
- [ ] Product review blogger outreach
- [ ] Gift guide placements (sezonsal)
- [ ] "Best of" listelerine dahil olma stratejisi
- [ ] HARO: retail, lifestyle, tech kategorileri

### Comparison & Discovery Platformları
- [ ] Google Shopping feed aktif ve optimize
- [ ] Pinterest shopping aktif
- [ ] Instagram Shopping / Meta Catalog
- [ ] TikTok Shop (uygunsa)
- [ ] Wirecutter / CNN Underscored gibi review sitelerine pitch
- [ ] BuzzFeed / Who What Wear gibi listicle sitelerine pitch

---

## FAZ 3 — İçerik Stratejisi (1-3 Ay)

### Answer-First İçerik
- [ ] "Best [product] for [use case]" → ürün sayfası bu soruya yanıtlıyor
- [ ] "[Problem] nasıl çözülür?" → blog ürünü entegre
- [ ] "Is [product] worth it?" → bağımsız değerlendirme tarzı sayfa
- [ ] "[Material/Ingredient] nedir?" → glossary içeriği
- [ ] Alıcı rehberleri ("How to choose the right [product]")

### SEO + GEO Odaklı Blog
- [ ] Ürün kategorisi rehberleri (uzun form)
- [ ] Karşılaştırma yazıları (kendi ürün vs kategori)
- [ ] Kullanım senaryosu içerikleri
- [ ] Seasonal content (gifting, holidays)
- [ ] "X under $Y" listicle'lar (AI bu formatı sever)

### Social Proof İçerikleri
- [ ] Before/After görseller + testimonials
- [ ] Customer story sayfaları
- [ ] Video testimonial'lar
- [ ] "How customers use [product]" serisi
- [ ] UGC galeri (izinli)

### AI Citation Stratejisi
- [ ] Reddit: niche subreddit'lerde ürün tavsiyesi (organic)
  - r/BuyItForLife, r/SkincareAddiction, r/[niche]
- [ ] Quora: ürün kategorisi soruları
- [ ] Amazon Q&A bölümü optimize
- [ ] YouTube: product review creator partnership
- [ ] Affiliate program (blog yazarlarına)

---

## FAZ 4 — Ölçüm & İzleme (Sürekli)

### Araçlar
- [ ] Google Search Console (ürün keyword'leri)
- [ ] Google Merchant Center Insights
- [ ] Shopify Analytics (kanal bazlı)
- [ ] Genessa AI mention tracker (haftalık)
- [ ] Trustpilot / Reviews.io dashboard
- [ ] Klaviyo / email analytics

### AI Citation Kontrolü (Haftalık)
- [ ] ChatGPT Shopping: "[Ürün kategorisi]" → öneriliyor mu?
- [ ] Perplexity: "Best [product]" → marka çıkıyor mu?
- [ ] Google AI Shopping: ürün adı + kategori sorguları
- [ ] Claude: "[Problem] için ne satın alayım?" → önerildi mi?
- [ ] Gemini: "[Gift idea / product type]" → listede mi?

### E-ticaret Metrikleri
- [ ] Organik trafik → purchase conversion
- [ ] AI kanalından gelen trafik (UTM)
- [ ] "How did you find us?" AI yanıtları
- [ ] Ortalama sipariş değeri (kanal bazlı)
- [ ] Return customer rate

### Haftalık Görev Kategorileri
- **Hafta 1-2:** Schema + llms.txt + ürün sayfası optimize
- **Hafta 3-4:** Review platform kurulumu + Google Shopping
- **Ay 2:** Alıcı rehberleri + blog başlangıç
- **Ay 3:** PR pitch + Reddit/Quora varlığı
- **Devam:** Haftalık içerik + AI citation izleme

---

## Danışmanlık Süresi ve Plan

| Dönem | Odak | Hedef |
|-------|------|-------|
| 1. Ay | Teknik altyapı + ürün schema | Readiness: 80+ |
| 2. Ay | Review ekosistemi + Google Shopping | Authority: 65+ |
| 3. Ay | İçerik + Reddit/Quora | İlk AI Shopping mention |
| 6. Ay | PR + affiliate + UGC | AI'dan ölçülebilir trafik |
| Sürekli | Sezonsal içerik + izleme | Category leader olmak |

---

## E-commerce İçin Özel AI Prompt Seti

> "Bu ürün veya marka, AI alışveriş asistanları tarafından öneriliyor mu?  
> Ürün açıklaması, review kalitesi ve karşılaştırma içerikleri  
> AI alışveriş önerilerini nasıl etkiliyor?  
> 'Best [product] for [use case]' sorgusunda bu marka nerede konumlanıyor?"
