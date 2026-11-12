"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckIcon, PlusIcon } from "@/components/ui/Icons";
import { useCart } from "./CartProvider";
import { cn } from "@/lib/format";
import type { Product } from "@/lib/types";

type Props = {
  product: Pick<Product, "id" | "slug" | "name_en" | "image_url" | "price_iqd" | "is_sold_out">;
  quantity?: number;
  option?: { id: string; name: string; price_delta_iqd: number } | null;
  variant?: "icon" | "full";
  disabled?: boolean;
  onAdded?: () => void;
  tone?: "dark" | "light";
};

export function AddToCartButton({ product, quantity = 1, option = null, variant = "icon", disabled, onAdded, tone = "dark" }: Props) {
  const { add } = useCart();
  const [done, setDone] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const soldOut = product.is_sold_out;
  const isDisabled = soldOut || disabled;

  const onClick = () => {
    if (isDisabled) return;
    add(
      {
        product_id: product.id,
        option_id: option?.id ?? null,
        slug: product.slug,
        name: product.name_en,
        option_name: option?.name ?? null,
        image_url: product.image_url,
        unit_price_iqd: product.price_iqd + (option?.price_delta_iqd ?? 0),
      },
      quantity,
    );
    setDone(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDone(false), 1400);
    onAdded?.();
  };

  if (variant === "icon") {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        disabled={isDisabled}
        whileTap={{ scale: 0.9 }}
        aria-label={soldOut ? `${product.name_en} — نفدت الكمية` : `أضف ${product.name_en} للسلة`}
        className={cn(
          "relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full transition-[background-color,box-shadow,color] duration-300",
          tone === "dark"
            ? "bg-forest text-ivory hover:bg-forest-deep hover:shadow-[var(--shadow-lift)]"
            : "bg-ivory text-forest hover:bg-paper",
          "disabled:bg-cocoa/10 disabled:text-cocoa/35 disabled:shadow-none",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.span key="ok" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 28 }}>
              <CheckIcon size={18} />
            </motion.span>
          ) : (
            <motion.span key="add" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <PlusIcon size={18} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      whileTap={{ scale: 0.98 }}
      className={cn("btn w-full", tone === "dark" ? "btn-primary" : "btn-light")}
    >
      <AnimatePresence mode="wait" initial={false}>
        {soldOut ? (
          <span key="sold">نفدت الكمية</span>
        ) : done ? (
          <motion.span key="ok" className="inline-flex items-center gap-2" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.2 }}>
            <CheckIcon size={18} /> انضافت للسلة
          </motion.span>
        ) : (
          <motion.span key="add" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.2 }}>
            أضف للسلة
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
