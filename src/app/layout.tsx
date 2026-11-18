import type { Metadata, Viewport } from "next";
import { cormorant, tajarib, thmanyah, thmanyahSerif } from "@/lib/fonts";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "KOKAYE | كوكاية — مو بس كوكيز. لحظة حلوة.", template: "%s — KOKAYE | كوكاية" },
  description: "كوكاية — كوكيز وحلويات مخبوزة من بغداد. اطلب أونلاين بسهولة وإحنا نتواصل وياك حتى نأكد التوصيل.",
  applicationName: "KOKAYE",
  openGraph: {
    type: "website",
    locale: "ar_IQ",
    siteName: "KOKAYE | كوكاية",
    images: [{ url: "/images/brand/assortment-v3.webp", width: 1200, height: 1500, alt: "كوكيز كوكاية" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#FBF3E8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${thmanyah.variable} ${thmanyahSerif.variable} ${tajarib.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}
