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
    name: "Restaurant & Café",
    emoji: "🍽️",
    headline: "Are people searching 'best restaurant' finding you on ChatGPT?",
    subheadline: "Genessa analyzes how your restaurant appears in AI systems and helps you stay ahead of competitors.",
    painPoint: "62% of customers now ask AI before making a reservation.",
    valueProps: [
      "Google Business & menu schema optimization",
      "TripAdvisor and Yelp AI signal analysis",
      "Local 'best restaurant' query visibility",
      "Reservation funnel AI compatibility",
    ],
    ctaLabel: "Scan My Restaurant for Free",
    exampleQuery: "Best romantic dinner spot in Istanbul",
    color: "#F97316",
  },
  clinic: {
    slug: "clinic",
    name: "Clinic & Health",
    emoji: "🏥",
    headline: "Patients are asking AI — is your clinic being recommended?",
    subheadline: "In healthcare, AI visibility equals trust. Genessa measures your clinic's E-E-A-T signals and AI recommendability.",
    painPoint: "71% of health queries now start with an AI assistant.",
    valueProps: [
      "Doctor profile & medical schema optimization",
      "E-E-A-T and trust signal analysis",
      "Patient acquisition AI query visibility",
      "Healthcare content authority score",
    ],
    ctaLabel: "Scan My Clinic for Free",
    exampleQuery: "Trusted dermatology clinic in Sisli",
    color: "#06B6D4",
  },
  saas: {
    slug: "saas",
    name: "SaaS & Tech",
    emoji: "💻",
    headline: "Does your product show up in AI comparison queries?",
    subheadline: "78% of B2B buyers now use AI for tool comparisons. Genessa analyzes how your product is positioned in these queries.",
    painPoint: "If you're not in 'best [category] tool' queries, buyers don't see you.",
    valueProps: [
      "SoftwareApplication schema & G2/Capterra signal analysis",
      "AI comparison query visibility score",
      "Documentation and API AI readability",
      "Competitor citation gap analysis",
    ],
    ctaLabel: "Scan My Product for Free",
    exampleQuery: "Best project management tool for small teams",
    color: "#8B5CF6",
  },
  hotel: {
    slug: "hotel",
    name: "Hotel & Hospitality",
    emoji: "🏨",
    headline: "Are travel AI assistants recommending your hotel?",
    subheadline: "Travelers ask ChatGPT now. Genessa analyzes how your hotel appears in AI travel assistants and measures your OTA dependency.",
    painPoint: "The biggest barrier to direct bookings: not showing up in AI.",
    valueProps: [
      "LodgingBusiness schema & OTA signal analysis",
      "Travel AI query visibility score",
      "Direct booking funnel optimization",
      "Experience content AI recommendability",
    ],
    ctaLabel: "Scan My Hotel for Free",
    exampleQuery: "Romantic honeymoon hotel in Cappadocia",
    color: "#F59E0B",
  },
  creator: {
    slug: "creator",
    name: "Creator & Consultant",
    emoji: "🎙️",
    headline: "Do AI systems recognize you as an expert?",
    subheadline: "Personal brand authority is now measured in AI. Genessa analyzes your thought leadership signals and AI recommendability.",
    painPoint: "An expert AI doesn't recommend is an expert who doesn't exist.",
    valueProps: [
      "Person schema & LinkedIn AI signal analysis",
      "Thought leadership content authority score",
      "Niche query visibility analysis",
      "Media mention and citation score",
    ],
    ctaLabel: "Scan My Profile for Free",
    exampleQuery: "Best digital marketing consultant in Turkey",
    color: "#EC4899",
  },
  legal: {
    slug: "legal",
    name: "Legal & Finance",
    emoji: "⚖️",
    headline: "Clients are asking AI — is your firm being recommended?",
    subheadline: "E-E-A-T is critical for YMYL content. Genessa measures your law firm's AI trust signals and recommendability.",
    painPoint: "Firms without AI trust signals don't get recommended in legal queries.",
    valueProps: [
      "LegalService schema & bar credential analysis",
      "E-E-A-T and YMYL trust score",
      "Attorney profile authority analysis",
      "Legal content AI readability score",
    ],
    ctaLabel: "Scan My Firm for Free",
    exampleQuery: "Trusted business law attorney in Istanbul",
    color: "#1D4ED8",
  },
  ecommerce: {
    slug: "ecommerce",
    name: "E-commerce",
    emoji: "🛍️",
    headline: "Are AI shopping assistants recommending your products?",
    subheadline: "The structure of shopping queries has changed. Genessa analyzes how your product pages appear in AI shopping assistants and recommendation engines.",
    painPoint: "Missing product schema means AI won't surface your products.",
    valueProps: [
      "Product schema & Google Merchant Center analysis",
      "AI shopping query visibility score",
      "Product comparison query positioning",
      "Review schema & social proof analysis",
    ],
    ctaLabel: "Scan My Store for Free",
    exampleQuery: "Best organic coffee brand in Turkey",
    color: "#10B981",
  },
};

export const SECTOR_SLUGS = Object.keys(SECTOR_META);
