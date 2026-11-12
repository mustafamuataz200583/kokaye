"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Logo } from "./Logo";
import { useCart } from "./CartProvider";
import { BagIcon, CloseIcon, MenuIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/format";

const NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/menu", label: "المنيو" },
  { href: "/about", label: "من نحن" },
  { href: "/track", label: "تتبع طلبك" },
];

export function Header({ topSlot }: { topSlot?: React.ReactNode }) {
  const pathname = usePathname();
  const { count, hydrated, openDrawer, bump } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-[100] focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-ivory">
        انتقل للمحتوى
      </a>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500",
          scrolled || menuOpen ? "bg-ivory/85 shadow-[0_1px_0_rgb(48_41_35/0.08)] backdrop-blur-xl" : "bg-transparent",
        )}
      >
        {topSlot}
        <div className={cn("container-k flex items-center justify-between transition-[height] duration-500", scrolled ? "h-16" : "h-20")}>
          <Link href="/" className="relative z-10 shrink-0" aria-label="كوكاية — الرئيسية">
            <Logo className={cn("h-auto transition-[width] duration-500", scrolled ? "w-[92px]" : "w-[108px]")} priority />
          </Link>

          <nav aria-label="القائمة الرئيسية" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "relative rounded-full px-4 py-2 text-[0.9375rem] font-medium transition-colors",
                      isActive(item.href) ? "text-forest" : "text-cocoa/70 hover:text-forest",
                    )}
                  >
                    {item.label}
                    {isActive(item.href) && (
                      <motion.span layoutId="nav-dot" className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-champagne" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openDrawer}
              className="relative grid h-11 w-11 place-items-center rounded-full text-forest transition-colors hover:bg-forest/5"
              aria-label={`السلة${hydrated && count ? ` — ${count} منتج` : ""}`}
            >
              <BagIcon size={22} />
              <AnimatePresence>
                {hydrated && count > 0 && (
                  <motion.span
                    key={bump}
                    initial={reduce ? false : { scale: 0.5, opacity: 0 }}
                    animate={{ scale: [1.25, 1], opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-1 left-0.5 grid h-[1.2rem] min-w-[1.2rem] place-items-center rounded-full bg-forest px-1 text-[0.6875rem] font-medium tabular-nums text-ivory"
                  >
                    {count > 99 ? "99+" : count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <Link href="/menu" className="btn btn-primary btn-sm hidden sm:inline-flex">
              اطلب الآن
            </Link>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full text-forest md:hidden"
              aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-40 bg-ivory pt-24 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <nav aria-label="القائمة" className="container-k">
              <ul className="flex flex-col">
                {NAV.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={reduce ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="border-b hairline"
                  >
                    <Link
                      href={item.href}
                      className={cn("flex items-center justify-between py-5 font-[family-name:var(--font-display)] text-[1.75rem] font-bold", isActive(item.href) ? "text-forest" : "text-cocoa/75")}
                    >
                      {item.label}
                      <span className="latin text-sm text-champagne">0{i + 1}</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mt-10">
                <Link href="/menu" className="btn btn-primary w-full">
                  اطلب الآن
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
