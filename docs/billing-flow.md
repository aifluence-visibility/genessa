# Genessa — Billing Flow & Agent Danışmanlık Modeli
## Ürün Katmanları ve Kullanıcı Yolculuğu

---

## Genel Yapı

Genessa 3 katmanlı bir ürün:

1. **SaaS Katmanı** — skorlar, izleme, raporlar
2. **Agent OS Katmanı** — sektöre özel AI danışman
3. **Sonuç** — AI sistemlerinde görünürlük ve önerilme

---

## Katman 1 — SaaS Planları

| Plan | Fiyat | Kapsam |
|------|-------|--------|
| Free | $0 | AI Readiness skoru, 1 scan |
| Growth | $49/ay | Tüm skorlar, tam checklist, aylık rapor |
| Pro | $149/ay | AI mention takibi, haftalık rapor, öncelikli destek |

Müşteri bu katmanda kendi başına çalışır.
Skorlarını görür, checklist'i takip eder.

---

## Katman 2 — Agent OS (AI Danışman Aboneliği)

### Nasıl Çalışır

Müşteri **tek bir danışmanlık fiyatı** görür — agent listesi değil.
"AI Danışmanımı Al" butonuna tıklayınca agent seçim ekranı açılır.

Her agent:
- Kendi adı ve avatarı var
- Sektöre özel uzmanlık tanımı
- 3 / 6 / 12 aylık program seçeneği

### Agent Listesi

| Kod Adı | Sektör | Uzmanlık |
|---------|--------|----------|
| TBD | Restaurant | Lokal SEO, TripAdvisor, Google Maps, rezervasyon funnel |
| TBD | Hospitality | OTA optimizasyon, direkt rezervasyon, deneyim içeriği |
| TBD | Clinic / Medical Tourism | Medikal authority, hasta acquisition, güven sinyalleri |
| TBD | Education | Program sayfaları, uluslararası öğrenci, akreditasyon |
| TBD | E-commerce | AI alışveriş, ürün schema, review ekosistemi |
| TBD | SaaS | AI citation, documentation, karşılaştırma sayfaları |
| TBD | Real Estate | Bölge otoritesi, uluslararası alıcı, lüks segment |
| TBD | Legal | E-E-A-T sinyalleri, baro otoritesi, expat hukuku |
| TBD | Finance | Lisans sinyalleri, compliance içerik, güven UX |
| TBD | Creator / Personal Brand | Thought leadership, platform varlığı, AI önerilirlik |

*İsimler ve avatarlar ayrıca belirlenecek*

### Program Seçenekleri

| Süre | Fiyat | Kapsam |
|------|-------|--------|
| 3 Ay | $X/ay | FAZ 1 + FAZ 2, teknik altyapı + entity otoritesi |
| 6 Ay | $X/ay | FAZ 1-3, içerik stratejisi dahil |
| 12 Ay | $X/ay | FAZ 1-4, tam program + sürekli izleme |

---

## Kullanıcı Yolculuğu (Tam Akış)

```
1. Üye ol
      ↓
2. Sektörünü seç (onboarding)
   → Arka planda ilgili agent aktif olur
      ↓
3. İlk scan → Readiness skoru görür
      ↓
4. Dashboard'da sektöre özel insight'lar
   Sektöre özel checklist (restaurant → TripAdvisor, clinic → medikal authority)
      ↓
5. Kişiselleştirilmiş pop-up / banner
   "Restaurant agent'ınız olmadan bu 3 kritik adımı kaçırıyorsunuz"
   → "AI Danışmanımı Al" butonu
      ↓
6. Agent seçim ekranı açılır
   [Reyna — Restaurant] [Atlas — Clinic] [...]
   Her agent: isim, avatar, uzmanlık, program seçeneği
      ↓
7. Program seç (3 / 6 / 12 ay) → ödeme
      ↓
8. BOOM — AI danışman aktif
   • Haftalık uygulanabilir adımlar (email + dashboard)
   • Sektöre özel içerik planı
   • FAZ programı başlar
   • Skor takibi — her adım skoru artırır
      ↓
9. Ölçülebilir sonuç
   "ChatGPT artık sizi öneriyor"
   "Perplexity bu ay 12 kez mention etti"
```

---

## Kişiselleştirilmiş Pop-up Mantığı

Kullanıcı sektörünü seçtiği için dashboard'da hedefli mesajlar gösterilebilir:

**Restaurant için:**
> "TripAdvisor profiliniz optimize edilmemiş. Benzer restoranlar bu adımla AI önerilerini %40 artırdı."
> [Reyna ile çalış →]

**Clinic için:**
> "Wikidata'da kaydınız yok. Medikal turizm sorgularında görünürlüğünüz düşük."
> [Danışmanınızla başlayın →]

**SaaS için:**
> "Karşılaştırma sayfanız yok. 'Best [kategori] tool' sorgularında rakipleriniz öneriliyor, siz değilsiniz."
> [AI Danışmanımı Al →]

---

## Gelir Modeli

```
Free → Growth → Pro    (SaaS, aylık/yıllık)
           +
Agent OS Danışmanlık   (3/6/12 ay program)
           +
Agency Tier            (ileride — birden fazla müşteriyi yönet)
```

**Unit Economics (Hedef):**
- Ortalama SaaS MRR: $99/kullanıcı
- Agent OS: $299-599/ay (6 ay minimum)
- LTV hedefi: $2.000-5.000/müşteri

---

## Yatırımcı Özeti

> Genessa, AI'da görünmek isteyen işletmeler için  
> sektöre özel AI danışman operating system'dir.
>
> Kullanıcı bir kez sektörünü seçer,  
> AI danışmanı o günden itibaren haftalık adımlar verir,  
> 3-12 ay içinde ChatGPT, Perplexity ve Claude o işletmeyi önerir.
>
> "AI'da görünürlük" satmıyoruz.  
> "AI'da var olmak" satıyoruz.
