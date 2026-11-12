import type { PublicSettings } from "@/lib/types";

export function StoreStatusBanner({ settings }: { settings: PublicSettings }) {
  if (settings.is_open) return null;
  return (
    <div className="relative z-[55] bg-forest text-ivory" role="status">
      <p className="container-k py-2.5 text-center text-[0.8125rem] leading-relaxed">
        {settings.closed_message}
        {settings.order_hours_text && <span className="text-ivory/70"> · {settings.order_hours_text}</span>}
      </p>
    </div>
  );
}
