"use client";

import { useFormAction } from "./useFormAction";

import { useState, useTransition } from "react";
import { updateOrderMeta, updateOrderStatus, type ActionState } from "@/app/admin/actions";
import { ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { cn, formatIQD } from "@/lib/format";
import { SpinnerIcon } from "@/components/ui/Icons";

export function StatusControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [current, setCurrent] = useState(status);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const change = (s: OrderStatus) => {
    if (s === current) return;
    if (s === "cancelled" && !window.confirm("متأكد تريد تلغي هذا الطلب؟")) return;
    const prev = current;
    setCurrent(s);
    start(async () => {
      const r = await updateOrderStatus(orderId, s);
      if (r.error) { setCurrent(prev); setMsg(r.error); } else setMsg("تم تحديث الحالة");
      window.setTimeout(() => setMsg(null), 2500);
    });
  };
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="حالة الطلب">
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={current === s}
            onClick={() => change(s)}
            disabled={pending}
            className={cn(
              "min-h-11 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
              current === s
                ? s === "cancelled" ? "border-cocoa bg-cocoa text-ivory" : "border-forest bg-forest text-ivory"
                : "hairline bg-paper text-cocoa/80 hover:border-forest/40",
            )}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      <p className="mt-2 h-5 text-xs text-muted" aria-live="polite">{pending ? "جاري الحفظ…" : msg}</p>
    </div>
  );
}

export function OrderMetaForm({ orderId, deliveryFee, adminNotes, subtotal }: { orderId: string; deliveryFee: number | null; adminNotes: string | null; subtotal: number }) {
  const [state, onSubmit, pending] = useFormAction(updateOrderMeta);
  const [fee, setFee] = useState(deliveryFee === null ? "" : String(deliveryFee));
  const feeNum = /^\d+$/.test(fee) ? Number(fee) : null;
  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <input type="hidden" name="order_id" value={orderId} />
      <div>
        <label htmlFor="delivery_fee" className="field-label">أجور التوصيل (د.ع)</label>
        <input id="delivery_fee" name="delivery_fee" inputMode="numeric" dir="ltr" className="field text-right" placeholder="تتحدد بعد التواصل" value={fee} onChange={(e) => setFee(e.target.value)} aria-invalid={state.fields?.delivery_fee ? true : undefined} />
        {state.fields?.delivery_fee && <p className="field-error">{state.fields.delivery_fee}</p>}
        <p className="mt-1.5 text-xs text-muted">المجموع الكلي: <span className="price text-cocoa">{feeNum === null ? "بانتظار تحديد التوصيل" : formatIQD(subtotal + feeNum)}</span></p>
      </div>
      <div>
        <label htmlFor="admin_notes" className="field-label">ملاحظات داخلية <span className="font-normal text-muted">(ما يشوفها الزبون)</span></label>
        <textarea id="admin_notes" name="admin_notes" className="field" rows={3} defaultValue={adminNotes ?? ""} maxLength={1000} />
      </div>
      <div className="flex items-center gap-3">
        <button className="btn btn-primary btn-sm" disabled={pending}>{pending ? <SpinnerIcon /> : null} حفظ</button>
        {state.message && <span className="text-xs text-forest" role="status">{state.message}</span>}
        {state.error && <span className="text-xs text-danger" role="alert">{state.error}</span>}
      </div>
    </form>
  );
}
