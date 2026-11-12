import type { Metadata } from "next";
import { OrderSuccess } from "@/components/store/OrderSuccess";
import { getPublicSettings } from "@/lib/catalog";

export const metadata: Metadata = { title: "تم استلام طلبك", robots: { index: false } };
export const revalidate = 60;

export default async function SuccessPage() {
  const settings = await getPublicSettings();
  return (
    <div className="container-k pt-32 pb-24 md:pt-40">
      <OrderSuccess whatsapp={settings.whatsapp_international} />
    </div>
  );
}
