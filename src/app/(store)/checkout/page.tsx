import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/CheckoutForm";

export const metadata: Metadata = { title: "إكمال الطلب", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="container-k pt-28 pb-24 md:pt-36">
      <p className="eyebrow">آخر خطوة</p>
      <h1 className="mt-4 text-4xl md:text-5xl">إكمال الطلب</h1>
      <p className="mt-3 text-muted">بدون حساب. بس معلومات التوصيل.</p>
      <CheckoutForm />
    </div>
  );
}
