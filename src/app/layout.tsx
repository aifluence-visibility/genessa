import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Genessa — Find out if AI can see your website",
    template: "%s · Genessa",
  },
  description: "AI visibility scoring for websites. Genessa scans your site against 5 protocols AI systems read and returns a score from 0-100.",
  openGraph: {
    title: "Genessa — AI Visibility Score",
    description: "Find out if AI can see your website. Free score in 30 seconds.",
    url: "https://genessa.io",
    siteName: "Genessa",
    type: "website",
  },
  metadataBase: new URL("https://genessa.io"),
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Genessa",
  description: "AI visibility scoring for websites",
  url: "https://genessa.io",
  applicationCategory: "BusinessApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
