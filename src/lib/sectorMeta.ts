export type SectorMeta = {
  slug: string;
  name: string;
  emoji: string;
  headline: string;
  subheadline: string;
  painPoint: string;
  valueProps: string[];
  ctaLabel: string;
  exampleQuery: string;
  color: string;
};

export const SECTOR_META: Record<string, SectorMeta> = {
  restaurant: {
    slug: "restaurant",
    name: "Restoran & Kafe",
    emoji: "🍽️",
    headline: "ChatGPT'de 'en iyi restoran' arayanlar sizi buluyor mu?",
    subheadline: "Genessa, restoranınızın AI sistemlerinde nasıl göründüğünü analiz eder ve rakiplerinizin önüne geçmenizi sağlar.",
    painPoint: "Müşterilerin %62'si artık rezervasyon yapmadan önce AI'a soruyor.",
    valueProps: [
      "Google Business ve menü schema optimizasyonu",
      "TripAdvisor ve Yelp AI sinyal analizi",
      "Yerel 'en iyi restoran' sorgularında görünürlük",
      "Rezervasyon funnel AI uyumluluğu",
    ],
    ctaLabel: "Restoranımı Ücretsiz Tara",
    exampleQuery: "İstanbul'da romantik akşam yemeği için en iyi yer",
    color: "#F97316",
  },
  clinic: {
    slug: "clinic",
    name: "Klinik & Sağlık",
    emoji: "🏥",
    headline: "Hastalar AI'a soruyor — kliniğiniz öneriliyor mu?",
    subheadline: "Sağlık sektöründe AI görünürlüğü güven demektir. Genessa, kliniğinizin E-E-A-T sinyallerini ve AI önerilebilirliğini ölçer.",
    painPoint: "Sağlık sorgularının %71'i artık AI asistanlarıyla başlıyor.",
    valueProps: [
      "Doktor profili ve medikal schema optimizasyonu",
      "E-E-A-T ve güven sinyali analizi",
      "Hasta edinimi AI sorgu görünürlüğü",
      "Sağlık içeriği authority skoru",
    ],
    ctaLabel: "Kliniğimi Ücretsiz Tara",
    exampleQuery: "Şişli'de güvenilir cilt kliniği",
    color: "#06B6D4",
  },
  saas: {
    slug: "saas",
    name: "SaaS & Tech",
    emoji: "💻",
    headline: "AI karşılaştırma sorgularında ürününüz var mı?",
    subheadline: "B2B alıcıların %78'i artık araç karşılaştırması için AI kullanıyor. Genessa, ürününüzün bu sorgularda nasıl konumlandığını analiz eder.",
    painPoint: "\"En iyi [kategori] aracı\" sorgularında yoksa, alıcı sizi görmüyor.",
    valueProps: [
      "SoftwareApplication schema ve G2/Capterra sinyal analizi",
      "AI karşılaştırma sorgusu görünürlük skoru",
      "Dokümantasyon ve API AI okunabilirliği",
      "Competitor citation gap analizi",
    ],
    ctaLabel: "Ürünümü Ücretsiz Tara",
    exampleQuery: "Küçük ekipler için en iyi proje yönetim aracı",
    color: "#8B5CF6",
  },
  hotel: {
    slug: "hotel",
    name: "Otel & Konaklama",
    emoji: "🏨",
    headline: "Seyahat AI'ları otelinizi öneriyor mu?",
    subheadline: "Gezginler artık ChatGPT'ye soruyor. Genessa, otelinizin AI seyahat asistanlarında nasıl göründüğünü analiz eder.",
    painPoint: "Direkt rezervasyonların önündeki en büyük engel: AI'da görünmemek.",
    valueProps: [
      "LodgingBusiness schema ve OTA sinyal analizi",
      "Seyahat AI sorgusu görünürlük skoru",
      "Direkt rezervasyon funnel optimizasyonu",
      "Deneyim içeriği AI önerilebilirlik analizi",
    ],
    ctaLabel: "Otelimi Ücretsiz Tara",
    exampleQuery: "Kapadokya'da romantik balayı oteli",
    color: "#F59E0B",
  },
  creator: {
    slug: "creator",
    name: "Creator & Danışman",
    emoji: "🎙️",
    headline: "AI sistemleri sizi uzman olarak tanıyor mu?",
    subheadline: "Kişisel marka otoritesi artık AI'da ölçülüyor. Genessa, thought leadership sinyallerinizi ve AI önerilebilirliğinizi analiz eder.",
    painPoint: "AI'ın önermediği uzman, var olmayan uzmandır.",
    valueProps: [
      "Person schema ve LinkedIn AI sinyal analizi",
      "Thought leadership içerik authority skoru",
      "Niche sorgu görünürlük analizi",
      "Medya mention ve citation skoru",
    ],
    ctaLabel: "Profilimi Ücretsiz Tara",
    exampleQuery: "Türkiye'de en iyi dijital pazarlama danışmanı",
    color: "#EC4899",
  },
  legal: {
    slug: "legal",
    name: "Hukuk & Finans",
    emoji: "⚖️",
    headline: "Müvekkiller AI'a soruyor — firmanız öneriliyor mu?",
    subheadline: "YMYL kategorisinde E-E-A-T kritiktir. Genessa, hukuk firmanızın AI güven sinyallerini ve önerilebilirliğini ölçer.",
    painPoint: "Hukuki sorgularda AI güven sinyali olmayan firma önerilmiyor.",
    valueProps: [
      "LegalService schema ve baro credential analizi",
      "E-E-A-T ve YMYL güven skoru",
      "Avukat profili authority analizi",
      "Hukuki içerik AI okunabilirlik skoru",
    ],
    ctaLabel: "Firmamı Ücretsiz Tara",
    exampleQuery: "İstanbul'da güvenilir iş hukuku avukatı",
    color: "#1D4ED8",
  },
  ecommerce: {
    slug: "ecommerce",
    name: "E-ticaret",
    emoji: "🛍️",
    headline: "AI alışveriş asistanları ürünlerinizi öneriyor mu?",
    subheadline: "Alışveriş sorgularının yapısı değişti. Genessa, ürün sayfalarınızın AI alışveriş asistanlarında nasıl göründüğünü analiz eder.",
    painPoint: "Product schema eksikse AI ürününüzü görmüyor.",
    valueProps: [
      "Product schema ve Google Merchant Center analizi",
      "AI alışveriş sorgusu görünürlük skoru",
      "Ürün karşılaştırma sorgusu pozisyonu",
      "Review schema ve sosyal proof analizi",
    ],
    ctaLabel: "Mağazamı Ücretsiz Tara",
    exampleQuery: "Türkiye'de en iyi organik kahve markası",
    color: "#10B981",
  },
};

export const SECTOR_SLUGS = Object.keys(SECTOR_META);
