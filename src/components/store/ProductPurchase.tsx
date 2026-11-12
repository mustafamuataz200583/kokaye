"use client";

import { useState } from "react";
import { AddToCartButton } from "./AddToCartButton";
import { QuantityStepper } from "./QuantityStepper";
import { useCart } from "./CartProvider";
import type { Product } from "@/lib/types";
import { cn, formatIQD } from "@/lib/format";

export function ProductPurchase({ product }: { product: Product }) {
  const options = product.options;
  const [qty, setQty] = useState(1);
  const [optionId, setOptionId] = useState<string | null>(null);
  const { openDrawer } = useCart();
  const option = options.find((o) => o.id === optionId) ?? null;
  const unit = product.price_iqd + (option?.price_delta_iqd ?? 0);

  return (
    <div>
      {options.length > 0 && (
        <fieldset className="mt-8">
          <legend className="text-sm font-medium text-cocoa">إضافات <span className="font-normal text-muted">(اختياري)</span></legend>
          <div className="mt-3 grid gap-2">
            {[{ id: null as string | null, name: "بدون إضافة", price_delta_iqd: 0, is_available: true }, ...options].map((o) => {
              const checked = optionId === o.id;
              return (
                <label
                  key={o.id ?? "none"}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-colors",
                    checked ? "border-forest bg-forest/[0.04]" : "border-cocoa/12 hover:border-cocoa/25",
                    !o.is_available && "cursor-not-allowed opacity-45",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="option"
                      className="h-4 w-4 accent-[var(--color-forest)]"
                      checked={checked}
                      disabled={!o.is_available}
                      onChange={() => setOptionId(o.id)}
                    />
                    {o.name}
                    {!o.is_available && <span className="text-xs text-muted">(غير متوفر)</span>}
                  </span>
                  {o.price_delta_iqd > 0 && <span className="price text-muted">+ {formatIQD(o.price_delta_iqd)}</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-8 flex items-center justify-between gap-4 border-t hairline pt-6">
        <QuantityStepper value={qty} onChange={setQty} label="الكمية" />
        <div className="text-left">
          <p className="text-xs text-muted">المجموع</p>
          <p className="price text-xl text-forest">{formatIQD(unit * qty)}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <AddToCartButton product={product} quantity={qty} option={option} variant="full" onAdded={() => setQty(1)} />
        <button type="button" className="btn btn-ghost" onClick={openDrawer}>عرض السلة</button>
      </div>
    </div>
  );
}
