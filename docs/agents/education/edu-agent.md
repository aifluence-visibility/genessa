# Education Agent OS
## Genessa Vertical Intelligence — University, Language School, Bootcamp & Online Academy

> **Hedef:** Eğitim kurumunu AI sistemlerinin "best university for [program]",  
> "language school Istanbul", "online bootcamp for [skill]" gibi sorgularda önerdiği,  
> uluslararası öğrenci için güvenilir eğitim otoritesi olarak tanıdığı bir marka yapmak.

---

## Sektör Profili

**Neden kritik:**
- "Which university should I apply to?" → ChatGPT'de soruluyor
- Uluslararası öğrenci araştırması tamamen dijital ve AI-driven
- Program sayfası kalitesi AI citation'ı doğrudan etkiliyor
- Akreditasyon ve ranking sinyalleri AI güvenilirlik skoru
- Lead değeri yüksek → 1 AI referral = tam öğrenci = $10K-$50K+ gelir

**Scoring Ağırlıkları:**
- AI Readiness: %35
- Authority (akreditasyon + ranking): %40
- Influence: %25

**Temel Segmentler:**
- Üniversiteler (lisans, yüksek lisans, doktora)
- Dil okulları (IELTS, TOEFL, genel İngilizce)
- Bootcamp'ler (coding, data science, UX, AI)
- Online akademiler (kurs platformları)
- Uluslararası öğrenci odaklı kurumlar
- Mesleki eğitim ve sertifika programları

---

## FAZ 1 — Kritik Teknik Altyapı (1-2 Hafta)

### Schema.org
- [ ] `EducationalOrganization` schema ana sayfada
- [ ] `CollegeOrUniversity` (üniversite ise)
- [ ] `Course` schema her program için
  - `name`, `description`, `provider`
  - `educationalLevel` (lisans, yüksek lisans vs)
  - `timeToComplete`
  - `offers` (ücret bilgisi)
- [ ] `CourseInstance` aktif dönemler için
- [ ] `EducationalOccupationalProgram` schema
- [ ] `Occupation` schema (mezun ne olur?)
- [ ] `Person` schema akademisyenler için
- [ ] `aggregateRating` (öğrenci yorumları)
- [ ] `FAQPage` schema (başvuru, ücret, vize, yurt)
- [ ] `BreadcrumbList` tüm sayfalarda
- [ ] `Event` schema açık günler ve webinarlar için

### llms.txt
- [ ] `/llms.txt` oluşturulmuş
- [ ] Kurum tipi ve uzmanlık alanı net
- [ ] Sunulan programlar listesi (özet)
- [ ] Akreditasyon ve ranking bilgisi
- [ ] Öğrenci profili (nereden, kaç yaş, hangi amaçla)
- [ ] Uluslararası öğrenci hizmetleri
  - Vize desteği
  - Konaklama
  - Kariyer desteği
- [ ] Dil gereksinimleri
- [ ] Başvuru süreci ve tarihler
- [ ] Başarı istatistikleri (mezun istihdam oranı vs)

### Robots.txt
- [ ] GPTBot: Allow
- [ ] ClaudeBot: Allow
- [ ] PerplexityBot: Allow
- [ ] Google-Extended: Allow
- [ ] Applebot-Extended: Allow
- [ ] Sitemap referansı eklenmiş

### Çok Dilli Altyapı
- [ ] Hreflang doğru (EN ana dil + hedef pazarlar)
- [ ] Arapça (Orta Doğu öğrenci için)
- [ ] Rusça / Ukraynaca (CIS öğrenci için)
- [ ] Türkçe (Türkiye pazarı için)
- [ ] Her dilde ana program sayfaları mevcut

### Teknik Altyapı
- [ ] Core Web Vitals geçiyor
- [ ] Mobil optimize (araştırma %80+ mobil)
- [ ] Başvuru formu hızlı ve basit
- [ ] Live chat / WhatsApp her sayfada
- [ ] Canonical URL'ler
- [ ] Sayfa hızı < 3 saniye

---

## FAZ 2 — Akreditasyon & Otorite (1 Ay)

### Akreditasyon Sinyalleri
- [ ] Akreditasyon logolar ana sayfada görünür
- [ ] Her akreditasyon için ayrı sayfa (detay + doğrulama linki)
- [ ] Uluslararası akreditasyonlar öne çıkarılmış
  - AACSB (business)
  - ABET (engineering)
  - EQUIS / AMBA (MBA)
  - Cambridge / British Council (dil okulu)
  - ACICS / ACCSC (bootcamp / vocational)
- [ ] Bakanlık onayı / resmi lisans sayfada
- [ ] Schema markup ile akreditasyon işaretlenmiş

### Ranking & Tanınırlık
- [ ] THE / QS / US News ranking sayfada (varsa)
- [ ] Sektörel listeler (subject rankings)
- [ ] "Best bootcamp" listeleri (Course Report, SwitchUp)
- [ ] Her ranking için kaynak linkli içerik

### Akademisyen & Fakülte Profilleri
- [ ] Her öğretim üyesi için ayrı sayfa
- [ ] Google Scholar profili bağlantısı
- [ ] Yayınlar ve araştırmalar
- [ ] Medya röportajları
- [ ] `Person` schema + `sameAs` LinkedIn

### Wikidata / Wikipedia
- [ ] Wikidata'ya kurum kaydı
  - `instance of: university` / `language school`
  - Kuruluş yılı, lokasyon, öğrenci sayısı
  - Akreditasyonlar
- [ ] Wikipedia sayfası (büyük kurumlar için)
- [ ] `sameAs`: LinkedIn, Facebook, resmi dizinler

### Review & Listing Platformları
- [ ] Google Business Profile tam dolu
- [ ] Trustpilot profili
- [ ] StudentCrowd / Uni Compare (üniversite)
- [ ] Course Report / SwitchUp (bootcamp)
- [ ] Massolit / GoOverseas (uluslararası)
- [ ] EduOpinions
- [ ] Yorum yanıtlama süreci aktif

### Media & PR
- [ ] Eğitim medyasında yer alma
  - Times Higher Education
  - The PIE News
  - Study International
  - QS TopUniversities blog
- [ ] Ulusal medyada mezun başarı hikayeleri
- [ ] HARO: eğitim, kariyer, teknoloji kategorileri

---

## FAZ 3 — İçerik Stratejisi (1-3 Ay)

### Answer-First İçerik
- [ ] "Best [program] in Turkey" → program sayfası bu soruya yanıtlıyor
- [ ] "How to study abroad in Turkey?" → adım adım rehber
- [ ] "Is [program] worth it?" → kariyer çıktıları ile yanıt
- [ ] "Cost of studying in [city]" → net maliyet hesabı
- [ ] "How to apply to [university]" → başvuru rehberi

### Program Sayfası Kalitesi
- [ ] Her program için 1000+ kelime içerik
- [ ] Müfredat detayı
- [ ] Kariyer çıktıları (ne olunur, maaş aralığı)
- [ ] Öğrenci profili (önceki kohordan örnekler)
- [ ] Mezun başarı hikayeleri
- [ ] Sık sorulan sorular (minimum 15 soru)
- [ ] Başvuru gereksinimleri net

### Uluslararası Öğrenci Rehberleri
- [ ] "Türkiye'de üniversite okumak" kapsamlı rehber
- [ ] Vize rehberi (ülkelere göre)
- [ ] Yaşam maliyeti rehberi (şehir bazlı)
- [ ] Konaklama rehberi
- [ ] "Student life in [city]" içerikleri
- [ ] Burs fırsatları sayfası

### Topical Authority
- [ ] Her program alanında uzman içerik
  - "Future of [field]" makaleleri
  - Sektör trendleri
  - Kariyer rehberleri
- [ ] Blog: öğrenci ve mezun hikayeleri
- [ ] Araştırma ve yayın özetleri (halkla paylaşılan)
- [ ] Webinar içerikleri (kayıtlı + transcript)

### Mention & Citation Stratejisi
- [ ] Reddit: r/ApplyingToCollege, r/languagelearning, r/learnprogramming
- [ ] Quora: program ve okul seçimi soruları
- [ ] Facebook grupları: expat, uluslararası öğrenci
- [ ] YouTube: "Study in Turkey" içerik partnership
- [ ] Influencer: öğrenci YouTuber / vlogger işbirliği

---

## FAZ 4 — Ölçüm & İzleme (Sürekli)

### Araçlar
- [ ] Google Search Console
- [ ] Google Analytics 4 (enrollment funnel izleme)
- [ ] Course Report / SwitchUp dashboard
- [ ] Genessa AI mention tracker (haftalık)
- [ ] Brand24 (kurum adı izleme)
- [ ] CRM: başvuru kaynak takibi

### AI Citation Kontrolü (Haftalık)
- [ ] ChatGPT: "Best [program] Turkey" → kurum çıkıyor mu?
- [ ] Perplexity: "Study [field] Istanbul" → mention var mı?
- [ ] Claude: "Uluslararası öğrenci için [ülke] üniversitesi" → öneriliyor mu?
- [ ] Google AI Overview: program + şehir keyword'leri
- [ ] Gemini: "Online bootcamp for [skill]" → listede mi?

### Enrollment Funnel Metrikleri
- [ ] Organik trafik → başvuru oranı
- [ ] AI kanalından gelen lead'ler (UTM)
- [ ] "How did you find us?" AI yanıtları
- [ ] Ülkelere göre başvuru kaynağı
- [ ] Lead → enrolled student conversion
- [ ] Ortalama öğrenci değeri (LTV)

### Haftalık Görev Kategorileri
- **Hafta 1-2:** Schema + llms.txt + program sayfası audit
- **Hafta 3-4:** Akreditasyon markup + review platformları
- **Ay 2:** Uluslararası rehber içerikleri + Wikidata
- **Ay 3:** PR + öğrenci hikayeleri + YouTube
- **Devam:** Haftalık AI citation + başvuru dönemine özel içerik

---

## Danışmanlık Süresi ve Plan

| Dönem | Odak | Hedef |
|-------|------|-------|
| 1. Ay | Teknik altyapı + program sayfaları + akreditasyon | Readiness: 75+ |
| 2. Ay | Review platformları + çok dilli içerik | Authority: 70+ |
| 3. Ay | Uluslararası rehberler + PR | İlk AI mention'lar |
| 6. Ay | Topical authority + başvuru artışı | 3 AI platformda öneriliyor |
| Sürekli | Sezonsal içerik (başvuru dönemleri) | Rakipleri geçmek |

---

## Education İçin Özel AI Prompt Seti

Genessa'nın bu vertical'de analiz yaparken kullandığı lens:

> "Bu eğitim kurumu, okul araştıran bir öğrenciye AI tarafından önerilecek mi?  
> Akreditasyon sinyalleri, program içeriği kalitesi ve uluslararası görünürlük  
> AI eğitim önerilerini nasıl etkiliyor?  
> 'Best [program] in Turkey' sorgusunda bu kurum nerede duruyor?"

---

## Multi-Agent Chain: Education Growth Audit

`/education-growth-audit` çalıştırınca devreye giren agent'lar:

| Agent | Görev |
|-------|-------|
| **AI Visibility Agent** | Schema, llms.txt, teknik altyapı |
| **Academic Authority Agent** | Akreditasyon, ranking, fakülte profilleri |
| **International Student Agent** | Çok dilli içerik, vize rehberleri, expat varlığı |
| **Content Gap Agent** | Program sayfası kalitesi, eksik içerikler |
| **Reputation Agent** | Review platformları, öğrenci yorumları |
| **Enrollment Funnel Agent** | Başvuru UX, lead conversion, CTA kalitesi |
