import type { Metadata } from "next";
import { CartPageView } from "@/components/store/CartPageView";
import { getPublicSettings } from "@/lib/catalog";

export const metadata: Metadata = { title: "السلة", robots: { index: false } };
export const revalidate = 60;

export default async function CartPage() {
  const settings = await getPublicSettings();
  return (
    <div className="container-k pt-28 pb-24 md:pt-36">
      <p className="eyebrow">سلتك</p>
      <h1 className="mt-4 text-4xl md:text-5xl">السلة</h1>
      <CartPageView deliveryNote={settings.delivery_note} />
    </div>
  );
}
