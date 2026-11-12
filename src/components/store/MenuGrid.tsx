"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ProductCard } from "./ProductCard";
import type { Category, Product } from "@/lib/types";
import { cn } from "@/lib/format";

export function MenuGrid({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [active, setActive] = useState<string>("all");

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("c");
    if (c && categories.some((x) => x.slug === c)) setActive(c);
  }, [categories]);

  const select = (slug: string) => {
    setActive(slug);
    const url = new URL(window.location.href);
    if (slug === "all") url.searchParams.delete("c");
    else url.searchParams.set("c", slug);
    window.history.replaceState(null, "", url);
  };

  const tabs = [{ slug: "all", label: "الكل" }, ...categories.map((c) => ({ slug: c.slug, label: c.name_en ?? c.name_ar }))];
  const visible = active === "all" ? products : products.filter((p) => p.category_slug === active);

  return (
    <>
      <div className="sticky top-16 z-30 -mx-5 bg-ivory/90 px-5 py-3 backdrop-blur-lg md:static md:mx-0 md:bg-transparent md:px-0 md:backdrop-blur-none">
        <LayoutGroup id="menu-filter">
          <div role="tablist" aria-label="تصنيفات المنيو" className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((t) => {
              const isActive = active === t.slug;
              return (
                <button
                  key={t.slug}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => select(t.slug)}
                  className={cn(
                    "relative shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-300",
                    isActive ? "text-ivory" : "text-cocoa/70 hover:text-forest",
                    t.slug !== "all" && "latin text-[1rem]",
                  )}
                >
                  {isActive && (
                    <motion.span layoutId="menu-pill" className="absolute inset-0 rounded-full bg-forest" transition={{ type: "spring", stiffness: 380, damping: 34 }} />
                  )}
                  <span className="relative">{t.label}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      <motion.ul layout className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-14" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((p, i) => (
            <motion.li
              key={p.id}
              layout
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: Math.min(i, 6) * 0.06 } }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
            >
              <ProductCard product={p} priority={i < 2} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      {visible.length === 0 && <p className="py-16 text-center text-muted">ماكو منتجات بهذا التصنيف حالياً.</p>}
    </>
  );
}
