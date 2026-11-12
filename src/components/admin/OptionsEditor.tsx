"use client";

import { useFormAction } from "./useFormAction";

import { useTransition } from "react";
import { addOption, deleteOption, toggleOption, type ActionState } from "@/app/admin/actions";
import { formatIQD } from "@/lib/format";

type Opt = { id: string; name: string; price_delta_iqd: number; is_available: boolean };

export function OptionsEditor({ productId, options }: { productId: string; options: Opt[] }) {
  const [state, onSubmit, pending] = useFormAction(addOption, { resetOnSuccess: true });
  const [busy, start] = useTransition();
  return (
    <section className="mt-4 rounded-2xl border hairline bg-paper p-5">
      <h2 className="text-lg">خيارات إضافية</h2>
      <p className="mt-1 text-sm text-muted">تظهر للزبون فقط إذا أضفتها هنا. السعر الإضافي يُضاف على سعر المنتج.</p>
      {options.length > 0 && (
        <ul className="mt-4 divide-y divide-cocoa/8">
          {options.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <span>{o.name} {o.price_delta_iqd > 0 && <span className="price text-muted">+ {formatIQD(o.price_delta_iqd)}</span>}</span>
              <span className="flex gap-2">
                <button type="button" disabled={busy} onClick={() => start(async () => { await toggleOption(o.id, productId, !o.is_available); })} className="btn btn-ghost btn-sm">{o.is_available ? "متوفر" : "غير متوفر"}</button>
                <button type="button" disabled={busy} onClick={() => window.confirm("حذف الخيار؟") && start(async () => { await deleteOption(o.id, productId); })} className="btn btn-sm text-danger">حذف</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
        <input type="hidden" name="product_id" value={productId} />
        <div><label className="field-label" htmlFor="o-name">اسم الخيار</label><input data-reset id="o-name" name="name" className="field" maxLength={60} required /></div>
        <div><label className="field-label" htmlFor="o-price">سعر إضافي</label><input id="o-price" name="price_delta_iqd" className="field text-right" dir="ltr" inputMode="numeric" defaultValue="0" required /></div>
        <button className="btn btn-primary btn-sm h-[3.25rem]" disabled={pending}>إضافة</button>
      </form>
      {state.error && <p className="field-error">{Object.values(state.fields ?? {})[0] ?? state.error}</p>}
    </section>
  );
}
