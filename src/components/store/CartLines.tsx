"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "./CartProvider";
import { QuantityStepper } from "./QuantityStepper";
import { TrashIcon } from "@/components/ui/Icons";
import { formatIQD } from "@/lib/format";

export function CartLines({ onNavigate, compact = false }: { onNavigate?: () => void; compact?: boolean }) {
  const { items, setQty, remove } = useCart();
  return (
    <ul className="divide-y divide-cocoa/8">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.li
            key={item.key}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.25 } }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex gap-4 py-4">
              <Link
                href={`/menu/${item.slug}`}
                onClick={onNavigate}
                className="relative block aspect-[4/5] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-studio"
                tabIndex={-1}
                aria-hidden="true"
              >
                {item.image_url ? (
                  <Image src={item.image_url} alt="" fill sizes="80px" className="object-cover" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-[0.625rem] text-muted">صورة مؤقتة</span>
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/menu/${item.slug}`} onClick={onNavigate} className="latin block truncate text-lg leading-tight text-forest">
                      {item.name}
                    </Link>
                    {item.option_name && <p className="text-xs text-muted">{item.option_name}</p>}
                    <p className="price mt-0.5 text-xs text-muted">{formatIQD(item.unit_price_iqd)} للقطعة</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.key)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-cocoa/45 transition-colors hover:bg-sand hover:text-danger"
                    aria-label={`حذف ${item.name} من السلة`}
                  >
                    <TrashIcon size={17} />
                  </button>
                </div>
                {item.unavailable ? (
                  <p className="mt-2 text-xs font-medium text-danger">غير متوفر حالياً — احذفه حتى تكمل الطلب</p>
                ) : (
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <QuantityStepper size="sm" value={item.quantity} onChange={(v) => setQty(item.key, v)} min={1} label={`كمية ${item.name}`} />
                    <motion.span key={item.quantity * item.unit_price_iqd} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="price text-[0.9375rem] text-cocoa">
                      {formatIQD(item.unit_price_iqd * item.quantity)}
                    </motion.span>
                  </div>
                )}
              </div>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
      {compact ? null : null}
    </ul>
  );
}
