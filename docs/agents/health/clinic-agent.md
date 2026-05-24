# Clinic / Medical Tourism Agent OS
## Genessa Vertical Intelligence — Health & Medical Tourism

> **Hedef:** Kliniği, AI sistemlerinin "en iyi IVF klinikleri", "Türkiye saç ekimi",  
> "estetik klinik İstanbul" gibi sorgularda önerdiği, güvenilir medikal otorite  
> olarak tanıdığı bir marka haline getirmek.

---

## Sektör Profili

**Neden kritik:**
- Medikal karar vermede AI kullanımı patladı
- "Best hair transplant clinics in Turkey" artık ChatGPT'de soruluyor
- Güven sinyalleri (akreditasyon, doktor profilleri, vaka sonuçları) AI tarafından ağırlıklandırılıyor
- Medical tourism için uluslararası hasta AI ile araştırıyor
- Rakip yoğunluğu yüksek → AI visibility fark yaratıyor

**Scoring Ağırlıkları:**
- AI Readiness: %35
- Authority (güven sinyalleri): %45
- Influence: %20

**Temel Segmentler:**
- IVF / Tüp bebek klinikleri
- Diş kliniği / Dental turizm
- Saç ekimi
- Estetik / Plastik cerrahi
- Obezite cerrahisi (gastric sleeve, bypass)
- Wellness / anti-aging klinikleri
- Göz kliniği (LASIK, lens)

---

## FAZ 1 — Kritik Teknik Altyapı (1-2 Hafta)

### Schema.org
- [ ] `MedicalClinic` veya `Physician` schema ana sayfada
- [ ] `medicalSpecialty` doğru tanımlanmış
- [ ] `MedicalProcedure` schema her tedavi sayfasında
- [ ] `Physician` schema her doktor için
  - `name`, `medicalSpecialty`, `affiliation`, `image`
- [ ] `aggregateRating` ile Google/Trustpilot/Realself puanları
- [ ] `Review` schema hasta yorumları için
- [ ] `FAQPage` schema (tedavi, fiyat, süreç soruları)
- [ ] `Organization` schema (akreditasyonlar dahil)
- [ ] `LocalBusiness` + `openingHours`
- [ ] `BreadcrumbList` tüm sayfalarda
- [ ] `HowTo` schema (tedavi süreci adımları)

### llms.txt
- [ ] `/llms.txt` oluşturulmuş
- [ ] Klinik uzmanlık alanları net tanımlanmış
- [ ] Doktor kadrosu özet bilgisi
- [ ] Akreditasyon ve sertifikalar
- [ ] Tedavi paketleri ve fiyat aralıkları
- [ ] Uluslararası hasta hizmetleri (transfer, konaklama, tercüman)
- [ ] Diller: EN, AR, DE, RU (medikal turizmde kritik)
- [ ] Başarı istatistikleri (gebelik oranı, vaka sayısı)

### Robots.txt
- [ ] GPTBot: Allow
- [ ] ClaudeBot: Allow
- [ ] PerplexityBot: Allow
- [ ] Google-Extended: Allow
- [ ] Applebot-Extended: Allow

### Çok Dilli Altyapı
- [ ] Hreflang doğru kurulmuş (TR, EN, AR, DE, RU)
- [ ] Her dil için ayrı URL yapısı
- [ ] Ana tedavi sayfaları tüm dillerde mevcut
- [ ] İletişim formu çok dilli
- [ ] WhatsApp + telefon numarası her sayfada visible

### Teknik Altyapı
- [ ] Core Web Vitals geçiyor (hasta güveni için kritik)
- [ ] SSL sertifikası geçerli
- [ ] Mobil optimizasyon (hastaların %80'i mobil)
- [ ] Sayfa hızı < 3 saniye
- [ ] Canonical URL'ler doğru

---

## FAZ 2 — Güven & Otorite (1 Ay)

### Akreditasyon & Sertifikalar
- [ ] JCI (Joint Commission International) sertifikası sayfada görünür
- [ ] ISO sertifikaları yayınlanmış
- [ ] Türkiye Sağlık Bakanlığı lisansı belirtilmiş
- [ ] TEMOS (medical travel certification) varsa eklendi
- [ ] Her akreditasyon için ayrı schema markup

### Doktor Profil Sayfaları
- [ ] Her doktorun ayrı sayfası
- [ ] Fotoğraf (profesyonel)
- [ ] Eğitim ve uzmanlık geçmişi
- [ ] Yayınlar / sempozyumlar (varsa)
- [ ] Vaka sayıları / deneyim yılı
- [ ] Video tanıtım (AI citation için güçlü sinyal)
- [ ] Google Scholar profili (bağlantı verilmiş)

### Wikidata / Wikipedia
- [ ] Wikidata'ya klinik kaydı
- [ ] `instance of: hospital` veya `medical clinic`
- [ ] Kuruluş yılı, lokasyon, uzmanlık alanları
- [ ] Wikipedia (yeterli büyüklükteyse)
- [ ] `sameAs`: Healthgrades, Zocdoc, Google Business

### Review & Listing Platformları
- [ ] Google Business Profile tam dolu ve aktif
- [ ] Trustpilot profili (yorum toplama aktif)
- [ ] RealSelf profili (estetik için kritik)
- [ ] Healthgrades profil
- [ ] Bookimed / WhatClinic / Mediturkey listeleme
- [ ] Treatwell (beauty/wellness için)
- [ ] Her platforma düzenli yanıt veriliyor

### Media & PR
- [ ] Sağlık haberleri sitelerinde mention
- [ ] Medikal turizm blog/dergilerinde yer alma
- [ ] International Patient Stories (video + yazılı)
- [ ] Doktorların medya röportajları
- [ ] "Medical tourism Turkey" içeriklerinde cite edilmiş

---

## FAZ 3 — İçerik Stratejisi (1-3 Ay)

### Answer-First İçerik
- [ ] "IVF Turkey cost 2024" → net fiyat bilgisi ilk paragrafta
- [ ] "Is hair transplant safe in Turkey?" → güven argümanları
- [ ] "Best dental clinics Istanbul" → neden bu klinik sorusuna yanıt
- [ ] Her tedavi için: "Nasıl çalışır → Kimler için uygun → Süreç → Fiyat → Sık sorular"
- [ ] Before/After sayfaları (schema markup ile)

### Hasta Yolculuğu İçeriği
- [ ] Tedavi rehberleri (adım adım)
- [ ] "Türkiye'de [tedavi] süreci nasıl işler?"
- [ ] Hazırlık checklist'leri
- [ ] Sonrası bakım rehberleri
- [ ] Uluslararası hasta guide'ı (uçuş, konaklama, transfer)
- [ ] Hasta hikayeleri (video + yazılı, çok dilli)
- [ ] Sık sorulan sorular sayfası (en az 30 soru)

### Medikal İçerik (E-E-A-T)
- [ ] Doktor imzalı makaleler
- [ ] Tedavi başarı istatistikleri (kaynaklı)
- [ ] Bilimsel referanslar
- [ ] "Reviewed by [Dr. Name]" etiketi
- [ ] Son güncelleme tarihi görünür

### Mention & Citation Stratejisi
- [ ] HARO: medikal, turizm, sağlık kategorileri
- [ ] Medikal turizm forumları (aktif katılım)
- [ ] Reddit: r/IVF, r/HairTransplant, r/DentalWork
- [ ] Expat toplulukları (FB grupları, forumlar)
- [ ] YouTube: hasta deneyim videoları

---

## FAZ 4 — Ölçüm & İzleme (Sürekli)

### Araçlar
- [ ] Google Search Console
- [ ] Google Business Profile Insights
- [ ] Trustpilot / RealSelf dashboard
- [ ] Genessa AI mention tracker (haftalık)
- [ ] Brand24 (marka izleme)

### AI Citation Kontrolü (Haftalık)
- [ ] ChatGPT: "Best IVF clinics Turkey" → klinik çıkıyor mu?
- [ ] Perplexity: "Hair transplant Istanbul" → mention var mı?
- [ ] Claude: "[Tedavi] için Türkiye'de nereye gidilir?" → öneriliyor mu?
- [ ] Google AI Overview: tedavi keyword'lerinde görünüyor mu?
- [ ] Gemini: "Medical tourism Turkey" → yer alıyor mu?

### Hasta Acquisition Metrikleri
- [ ] Organik trafik (ülkelere göre)
- [ ] WhatsApp başlangıç sayısı
- [ ] Form doluşları (ülkelere göre)
- [ ] Consultation → Treatment conversion oranı
- [ ] Hangi AI kanalından gelen hasta daha kaliteli?

### Haftalık Görev Kategorileri
- **Hafta 1-2:** Schema + llms.txt + doktor profilleri
- **Hafta 3-4:** Review platformları + Google Business optimizasyon
- **Ay 2:** Çok dilli içerik + hasta hikayeleri
- **Ay 3:** PR + medikal makale yayınları
- **Devam:** Haftalık AI citation + aylık içerik takvimi

---

## Danışmanlık Süresi ve Plan

| Dönem | Odak | Hedef |
|-------|------|-------|
| 1. Ay | Teknik altyapı + doktor profilleri + schema | Readiness: 75+ |
| 2. Ay | Review platformları + çok dilli içerik | Authority: 70+ |
| 3. Ay | AI citation + PR + hasta hikayeleri | İlk AI mention'lar |
| 6. Ay | Topical authority + uluslararası görünürlük | 3 AI platformda öneriliyor |
| Sürekli | Haftalık izleme | Rakipleri geçmek |

---

## Medikal Turizm İçin Özel AI Prompt Seti

Genessa'nın bu vertical'de analiz yaparken kullandığı lens:

> "Bu klinik, uluslararası hasta arayan birine AI tarafından öneriliyor mu?  
> Doktor otoritesi, akreditasyon sinyalleri ve hasta yorumları  
> AI güvenilirlik değerlendirmesini nasıl etkiliyor?  
> 'Best IVF clinics Turkey' gibi yüksek değerli sorgularda bu klinik nerede duruyor?"
