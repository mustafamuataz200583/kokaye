import type { MetadataRoute } from "next";
import { getVisibleProducts } from "@/lib/catalog";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const products = await getVisibleProducts().catch(() => []);
  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/menu`, priority: 0.9 },
    { url: `${base}/about` },
    { url: `${base}/contact` },
    { url: `${base}/track` },
    { url: `${base}/privacy` },
    { url: `${base}/terms` },
    ...products.map((p) => ({ url: `${base}/menu/${p.slug}`, priority: 0.8 })),
  ];
}
