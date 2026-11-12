import type { Metadata } from "next";
import { Reveal } from "@/components/store/Reveal";
import { ClockIcon, PhoneIcon, PinIcon, TruckIcon, WhatsappIcon } from "@/components/ui/Icons";
import { getPublicSettings } from "@/lib/catalog";

export const metadata: Metadata = { title: "تواصل ويانا", description: "رقم طلبات كوكاية وواتساب ومعلومات التوصيل." };
export const revalidate = 60;

export default async function ContactPage() {
  const s = await getPublicSettings();
  const rows = [
    { Icon: PinIcon, label: "الموقع", value: s.location_text },
    s.order_hours_text ? { Icon: ClockIcon, label: "استقبال الطلبات", value: s.order_hours_text } : null,
    { Icon: TruckIcon, label: "التوصيل", value: [s.delivery_area_text, s.delivery_note].filter(Boolean).join(" — ") },
  ].filter(Boolean) as { Icon: typeof PinIcon; label: string; value: string }[];

  return (
    <div className="container-k pt-28 pb-24 md:pt-36">
      <Reveal className="max-w-2xl">
        <p className="eyebrow">تواصل ويانا</p>
        <h1 className="mt-4 text-4xl md:text-5xl">نحب نسمع منك</h1>
        <p className="mt-4 text-muted">{s.contact_note || "للطلبات أو أي سؤال، اتصل أو راسلنا على واتساب."}</p>
      </Reveal>
      <div className="mt-12 grid gap-8 md:grid-cols-12">
        <Reveal className="grid gap-3 md:col-span-5">
          <a href={`tel:${s.phone}`} className="group flex items-center justify-between rounded-[var(--radius-card)] border hairline bg-paper p-6 transition-shadow hover:shadow-[var(--shadow-soft)]">
            <span className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-sand text-forest"><PhoneIcon /></span>
              <span><span className="block text-sm text-muted">اتصل بينا</span><span className="block text-xl font-medium tabular-nums text-forest" dir="ltr">{s.phone}</span></span>
            </span>
          </a>
          <a href={`https://wa.me/${s.whatsapp_international}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-[var(--radius-card)] bg-forest p-6 text-ivory transition-colors hover:bg-forest-deep">
            <span className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-ivory/10"><WhatsappIcon size={22} /></span>
              <span><span className="block text-sm text-ivory/70">راسلنا على</span><span className="block text-xl font-medium">واتساب</span></span>
            </span>
          </a>
        </Reveal>
        <Reveal delay={0.1} className="md:col-span-6 md:col-start-7">
          <dl className="divide-y divide-cocoa/8 border-y hairline">
            {rows.map(({ Icon, label, value }) => (
              <div key={label} className="flex gap-4 py-5">
                <Icon className="mt-1 shrink-0 text-champagne" />
                <div><dt className="text-sm text-muted">{label}</dt><dd className="mt-1 text-cocoa">{value}</dd></div>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </div>
  );
}
