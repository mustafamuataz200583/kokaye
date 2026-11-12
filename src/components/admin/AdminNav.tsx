"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";

const ITEMS = [
  { href: "/admin", label: "الرئيسية" },
  { href: "/admin/orders", label: "الطلبات" },
  { href: "/admin/products", label: "المنتجات" },
  { href: "/admin/settings", label: "الإعدادات" },
];

export function AdminNav({ newCount }: { newCount: number }) {
  const path = usePathname();
  return (
    <nav aria-label="لوحة التحكم" className="flex gap-1 overflow-x-auto [scrollbar-width:none] md:flex-col">
      {ITEMS.map((i) => {
        const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-[0.9375rem] font-medium transition-colors",
              active ? "bg-forest text-ivory" : "text-cocoa/75 hover:bg-paper hover:text-forest",
            )}
          >
            {i.label}
            {i.href === "/admin/orders" && newCount > 0 && (
              <span className={cn("rounded-full px-2 py-0.5 text-xs tabular-nums", active ? "bg-ivory/20" : "bg-champagne/25 text-cocoa")}>{newCount}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
