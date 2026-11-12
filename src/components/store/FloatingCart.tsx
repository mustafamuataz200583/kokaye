"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "./CartProvider";
import { BagIcon } from "@/components/ui/Icons";
import { formatIQD } from "@/lib/format";

const HIDDEN_ON = ["/checkout", "/cart", "/order"];

/** Mobile-only shortcut to the cart once there is something in it. */
export function FloatingCart() {
  const { count, subtotal, hydrated, openDrawer, toasts, drawerOpen } = useCart();
  const pathname = usePathname();
  const show = hydrated && count > 0 && !drawerOpen && toasts.length === 0 && !HIDDEN_ON.some((p) => pathname.startsWith(p));
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            type="button"
            onClick={openDrawer}
            className="flex h-14 w-full items-center justify-between rounded-full bg-forest pr-5 pl-2 text-ivory shadow-[var(--shadow-lift)] active:scale-[0.99]"
          >
            <span className="flex items-center gap-2.5 text-sm font-medium">
              <BagIcon size={20} /> السلة · <span className="tabular-nums">{count}</span>
            </span>
            <span className="price rounded-full bg-ivory/12 px-4 py-2.5 text-sm">{formatIQD(subtotal)}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
