"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCart } from "./CartProvider";
import { CheckIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/format";

export function Toaster() {
  const { toasts, dismissToast } = useCart();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-[70] flex flex-col items-center gap-2 px-4" aria-live="polite" role="status">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            type="button"
            key={t.id}
            layout
            onClick={() => dismissToast(t.id)}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.2 } }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "pointer-events-auto flex items-center gap-2.5 rounded-full px-5 py-3 text-sm font-medium shadow-[var(--shadow-lift)]",
              t.tone === "error" ? "bg-danger text-ivory" : t.tone === "info" ? "bg-cocoa text-ivory" : "bg-forest text-ivory",
            )}
          >
            {t.tone === "success" && (
              <span className="grid h-5 w-5 place-items-center rounded-full bg-ivory/15"><CheckIcon size={13} /></span>
            )}
            {t.message}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
