"use client";

import { MAX_QTY_PER_LINE } from "@/lib/constants";
import { MinusIcon, PlusIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/format";
import { AnimatePresence, motion } from "motion/react";

type Props = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  label: string;
  size?: "sm" | "md";
};

export function QuantityStepper({ value, onChange, min = 1, label, size = "md" }: Props) {
  const h = size === "sm" ? "h-10" : "h-12";
  const w = size === "sm" ? "w-10" : "w-12";
  return (
    <div
      className={cn("inline-flex items-center rounded-full border border-cocoa/12 bg-paper", h)}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className={cn("grid place-items-center rounded-full text-forest transition-colors hover:bg-sand disabled:opacity-30", h, w)}
        onClick={() => onChange(Math.min(value + 1, MAX_QTY_PER_LINE))}
        disabled={value >= MAX_QTY_PER_LINE}
        aria-label="زيادة الكمية"
      >
        <PlusIcon size={16} />
      </button>
      <span className="relative w-7 overflow-hidden text-center font-medium tabular-nums" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            className="block"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </span>
      <button
        type="button"
        className={cn("grid place-items-center rounded-full text-forest transition-colors hover:bg-sand disabled:opacity-30", h, w)}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="تقليل الكمية"
      >
        <MinusIcon size={16} />
      </button>
    </div>
  );
}
