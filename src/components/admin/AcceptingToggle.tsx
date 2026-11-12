"use client";

import { useOptimistic, useTransition } from "react";
import { setAcceptingOrders } from "@/app/admin/actions";
import { cn } from "@/lib/format";

export function AcceptingToggle({ value, isOpen }: { value: boolean; isOpen: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(value);
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border hairline bg-paper px-4 py-3">
      <div>
        <p className="text-sm font-medium text-cocoa">استقبال الطلبات</p>
        <p className="text-xs text-muted">{isOpen ? "مفتوح هسه للزبائن" : optimistic ? "مفعّل، بس خارج أوقات الاستقبال" : "مغلق — الزبائن يشوفون تنويه"}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={optimistic}
        aria-label="استقبال الطلبات"
        disabled={pending}
        onClick={() => start(async () => { setOptimistic(!optimistic); await setAcceptingOrders(!optimistic); })}
        className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300", optimistic ? "bg-forest" : "bg-cocoa/20")}
      >
        <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-paper shadow transition-[inset] duration-300", optimistic ? "right-6" : "right-1")} />
      </button>
    </div>
  );
}
