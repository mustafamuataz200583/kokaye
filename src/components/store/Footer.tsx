import Link from "next/link";
import { Logo } from "./Logo";
import { FacebookIcon, InstagramIcon, PhoneIcon, SnapchatIcon, TiktokIcon, WhatsappIcon } from "@/components/ui/Icons";
import type { PublicSettings } from "@/lib/types";

export function Footer({ settings }: { settings: PublicSettings }) {
  const socials = [
    { url: settings.instagram_url, label: "Instagram", Icon: InstagramIcon },
    { url: settings.tiktok_url, label: "TikTok", Icon: TiktokIcon },
    { url: settings.facebook_url, label: "Facebook", Icon: FacebookIcon },
    { url: settings.snapchat_url, label: "Snapchat", Icon: SnapchatIcon },
  ].filter((s) => s.url);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t hairline bg-ivory text-cocoa">
      <div className="container-k grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-4">
          <Logo className="h-auto w-[132px]" />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted">مو بس كوكيز. لحظة حلوة.</p>
          {socials.length > 0 && (
            <ul className="mt-6 flex gap-2">
              {socials.map(({ url, label, Icon }) => (
                <li key={label}>
                  <a href={url!} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid h-10 w-10 place-items-center rounded-full border border-forest/20 text-forest/80 transition-colors hover:border-forest hover:text-forest">
                    <Icon size={18} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="روابط" className="md:col-span-3">
          <p className="text-sm font-bold text-forest">الأقسام</p>
          <ul className="mt-4 grid gap-2.5 text-[0.9375rem] text-cocoa/80">
            <li><Link className="link-underline" href="/menu">المنيو</Link></li>
            <li><Link className="link-underline" href="/about">من نحن</Link></li>
            <li><Link className="link-underline" href="/track">تتبع طلبك</Link></li>
            <li><Link className="link-underline" href="/contact">تواصل ويانا</Link></li>
          </ul>
        </nav>

        <div className="md:col-span-5">
          <p className="text-sm font-bold text-forest">الطلبات والتواصل</p>
          <ul className="mt-4 grid gap-3 text-[0.9375rem] text-cocoa/80">
            <li>
              <a href={`tel:${settings.phone}`} className="inline-flex items-center gap-2.5 hover:text-forest">
                <PhoneIcon size={18} /> <span dir="ltr" className="tabular-nums">{settings.phone}</span>
              </a>
            </li>
            <li>
              <a href={`https://wa.me/${settings.whatsapp_international}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 hover:text-forest">
                <WhatsappIcon size={18} /> واتساب
              </a>
            </li>
            <li className="text-muted">{settings.location_text}</li>
            {settings.order_hours_text && <li className="text-muted">{settings.order_hours_text}</li>}
            <li className="max-w-sm text-sm leading-relaxed text-muted">{settings.delivery_note}</li>
          </ul>
        </div>
      </div>
      <div className="border-t hairline">
        <div className="container-k flex flex-col gap-3 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} KOKAYE | كوكاية</p>
          <ul className="flex gap-5">
            <li><Link href="/privacy" className="hover:text-forest">سياسة الخصوصية</Link></li>
            <li><Link href="/terms" className="hover:text-forest">الشروط</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
