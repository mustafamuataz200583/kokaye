"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { moveProduct, toggleProductFlag } from "@/app/admin/actions";
import type { AdminProduct } from "@/lib/admin-data";
import { cn, formatIQD } from "@/lib/format";
import { ChevronIcon } from "@/components/ui/Icons";

function Flag({ on, label, onToggle, disabled }: { on: boolean; label: string; onToggle: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onToggle} disabled={disabled} aria-pressed={on} className={cn("rounded-full border px-2.5 py-1 text-xs font-medium transition-colors", on ? "border-forest bg-forest text-ivory" : "hairline bg-paper text-muted hover:border-forest/40")}>
      {label}
    </button>
  );
}

export function ProductRow({ p, first, last }: { p: AdminProduct; first: boolean; last: boolean }) {
  const [flags, setFlags] = useOptimistic({ is_visible: p.is_visible, is_sold_out: p.is_sold_out, is_featured: p.is_featured });
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const toggle = (k: keyof typeof flags) =>
    start(async () => {
      setError(null);
      setFlags({ ...flags, [k]: !flags[k] });
      const r = await toggleProductFlag(p.id, k, !flags[k]);
      if (r.error) setError(r.error);
    });
  return (
    <li className={cn("flex flex-wrap items-center gap-4 rounded-2xl border hairline bg-paper p-3 sm:flex-nowrap", !flags.is_visible && "opacity-60")}>
      <div className="flex flex-col">
        <button type="button" aria-label="تحريك لفوق" disabled={first || pending} onClick={() => start(async () => { await moveProduct(p.id, "up"); })} className="grid h-7 w-8 place-items-center rounded-md text-muted hover:bg-sand disabled:opacity-25"><ChevronIcon size={16} className="rotate-180" /></button>
        <button type="button" aria-label="تحريك لجوه" disabled={last || pending} onClick={() => start(async () => { await moveProduct(p.id, "down"); })} className="grid h-7 w-8 place-items-center rounded-md text-muted hover:bg-sand disabled:opacity-25"><ChevronIcon size={16} /></button>
      </div>
      <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-sand">
        {p.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="grid h-full place-items-center text-[0.6rem] text-muted">بدون صورة</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/admin/products/${p.id}`} className="latin block truncate text-lg text-forest hover:underline">{p.name_en}</Link>
        <p className="text-xs text-muted">{p.category_name ?? "بدون تصنيف"} · <span className={cn("price", p.price_iqd > 0 ? "text-cocoa" : "text-danger")}>{p.price_iqd > 0 ? formatIQD(p.price_iqd) : "بدون سعر"}</span> · {p.order_count} طلب</p>
        {error && <p className="mt-1 text-xs text-danger" role="alert">{error}</p>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Flag on={flags.is_visible} label={flags.is_visible ? "ظاهر" : "مخفي"} onToggle={() => toggle("is_visible")} disabled={pending} />
        <Flag on={flags.is_sold_out} label="نفدت الكمية" onToggle={() => toggle("is_sold_out")} disabled={pending} />
        <Flag on={flags.is_featured} label="مميز" onToggle={() => toggle("is_featured")} disabled={pending} />
      </div>
      <Link href={`/admin/products/${p.id}`} className="btn btn-ghost btn-sm">تعديل</Link>
    </li>
  );
}
