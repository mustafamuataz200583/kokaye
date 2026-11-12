import type { Metadata } from "next";
import { TrackOrder } from "@/components/store/TrackOrder";

export const metadata: Metadata = { title: "تتبع طلبك", description: "تابع حالة طلبك من كوكاية برقم الطلب ورقم الهاتف." };

export default function TrackPage() {
  return (
    <div className="container-k pt-28 pb-24 md:pt-36">
      <p className="eyebrow">تتبع طلبك</p>
      <h1 className="mt-4 text-4xl md:text-5xl">وين وصل طلبك؟</h1>
      <TrackOrder />
    </div>
  );
}
