"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "./CartProvider";
import { CartLines } from "./CartLines";
import { formatIQD } from "@/lib/format";

export function CartPageView({ deliveryNote }: { deliveryNote: string }) {
  const { items, hydrated, subtotal, refreshQuote, quoteState } = useCart();
  useEffect(() => {
    if (hydrated && items.length) void refreshQuote();
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hydrated) {
    return <div className="mt-10 grid gap-4">{[0, 1].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>;
  }
  if (items.length === 0) {
    return (
      <div className="mt-12 rounded-[var(--radius-card)] border hairline bg-paper/60 px-6 py-16 text-center">
        <p className="text-xl font-medium text-forest">سلتك فارغة</p>
        <p className="mt-2 text-muted">اختار اللي يعجبك من المنيو.</p>
        <Link href="/menu" className="btn btn-primary mt-6">تصفح المنيو</Link>
      </div>
    );
  }
  const hasUnavailable = items.some((i) => i.unavailable);
  return (
    <div className="mt-10 grid gap-10 md:grid-cols-12">
      <div className="md:col-span-7">
        <CartLines />
      </div>
      <aside className="md:col-span-5">
        <div className="rounded-[var(--radius-card)] border hairline bg-paper p-6 md:sticky md:top-28">
          <div className="flex items-baseline justify-between">
            <span className="text-muted">مجموع المنتجات</span>
            <span className="price text-2xl text-forest">{formatIQD(subtotal)}</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between text-sm">
            <span className="text-muted">التوصيل</span>
            <span className="text-cocoa">يتحدد بعد التواصل</span>
          </div>
          <p className="mt-4 rounded-xl bg-sand/70 px-4 py-3 text-xs leading-relaxed text-muted">{deliveryNote}</p>
          {quoteState === "error" && <p className="mt-3 text-xs text-danger">ما قدرنا نحدث الأسعار هسه. راح نتأكد منها عند تأكيد الطلب.</p>}
          {hasUnavailable && <p className="mt-3 text-sm font-medium text-danger">احذف المنتجات غير المتوفرة حتى تكمل.</p>}
          {hasUnavailable ? (
            <button className="btn btn-primary mt-6 w-full" disabled>إكمال الطلب</button>
          ) : (
            <Link href="/checkout" className="btn btn-primary mt-6 w-full">إكمال الطلب</Link>
          )}
          <Link href="/menu" className="btn btn-ghost btn-sm mt-2 w-full">أضف منتجات ثانية</Link>
        </div>
      </aside>
    </div>
  );
}
