"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCart } from "./CartProvider";
import { CartLines } from "./CartLines";
import { BagIcon, CloseIcon } from "@/components/ui/Icons";
import { formatIQD } from "@/lib/format";

export function CartDrawer({ deliveryNote }: { deliveryNote: string }) {
  const { drawerOpen, closeDrawer, items, subtotal, refreshQuote } = useCart();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const hasUnavailable = items.some((i) => i.unavailable);

  useEffect(() => closeDrawer(), [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!drawerOpen) return;
    lastFocus.current = document.activeElement as HTMLElement;
    document.documentElement.style.overflow = "hidden";
    if (items.length) void refreshQuote();
    const t = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      lastFocus.current?.focus?.();
    };
  }, [drawerOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {drawerOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="cart-title">
          <motion.div
            className="absolute inset-0 bg-cocoa/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeDrawer}
          />
          <motion.div
            ref={panelRef}
            className="absolute inset-y-0 left-0 flex w-full max-w-[26rem] flex-col bg-ivory shadow-2xl"
            initial={reduce ? { opacity: 0 } : { x: "-100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "-100%" }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="flex items-center justify-between border-b hairline px-6 py-5">
              <h2 id="cart-title" className="text-xl">السلة</h2>
              <button type="button" onClick={closeDrawer} data-autofocus className="grid h-10 w-10 place-items-center rounded-full text-forest hover:bg-sand" aria-label="إغلاق السلة">
                <CloseIcon size={20} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-sand text-forest/60"><BagIcon size={26} /></span>
                <p className="text-lg font-medium text-forest">سلتك فارغة</p>
                <p className="text-sm text-muted">اختار اللي يعجبك من المنيو.</p>
                <Link href="/menu" className="btn btn-primary mt-2" onClick={closeDrawer}>تصفح المنيو</Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto overscroll-contain px-6">
                  <CartLines onNavigate={closeDrawer} />
                </div>
                <div className="border-t hairline bg-ivory px-6 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-muted">مجموع المنتجات</span>
                    <span className="price text-xl text-forest">{formatIQD(subtotal)}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{deliveryNote}</p>
                  {hasUnavailable && <p className="mt-2 text-xs font-medium text-danger">بالسلة منتج غير متوفر. احذفه حتى تكمل.</p>}
                  <div className="mt-4 grid gap-2">
                    {hasUnavailable ? (
                      <button type="button" className="btn btn-primary w-full" disabled>
                        إكمال الطلب
                      </button>
                    ) : (
                      <Link href="/checkout" className="btn btn-primary w-full" onClick={closeDrawer}>
                        إكمال الطلب
                      </Link>
                    )}
                    <Link href="/cart" className="btn btn-ghost btn-sm w-full" onClick={closeDrawer}>عرض السلة</Link>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
