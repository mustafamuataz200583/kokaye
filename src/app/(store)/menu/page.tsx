import type { Metadata } from "next";
import { MenuGrid } from "@/components/store/MenuGrid";
import { Reveal } from "@/components/store/Reveal";
import { getCategories, getVisibleProducts } from "@/lib/catalog";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "المنيو",
  description: "منيو كوكاية: كوكيز كلاسيك ونكهات خاصة وحلويات للمشاركة. الأسعار بالدينار العراقي.",
};

export default async function MenuPage() {
  const [products, categories] = await Promise.all([getVisibleProducts(), getCategories()]);
  return (
    <div className="container-k pt-28 pb-24 md:pt-36">
      <Reveal className="max-w-2xl">
        <p className="eyebrow">المنيو</p>
        <h1 className="mt-4 text-4xl md:text-6xl">اختار لحظتك</h1>
        <p className="mt-4 text-muted">كل الأسعار بالدينار العراقي. أجور التوصيل تتحدد بعد التواصل وياك.</p>
      </Reveal>
      <div className="mt-10">
        <MenuGrid products={products} categories={categories} />
      </div>
    </div>
  );
}
