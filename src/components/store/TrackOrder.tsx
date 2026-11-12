"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CUSTOMER_FLOW, STATUS_CUSTOMER_HINT, STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { CheckIcon, SpinnerIcon } from "@/components/ui/Icons";
import { cn, formatDateTime, formatIQD } from "@/lib/format";

type Result = {
  order_number: string;
  status: OrderStatus;
  created_at: string;
  status_changed_at: string;
  customer_first_name: string;
  subtotal_iqd: number;
  delivery_fee_iqd: number | null;
  items: { name: string; option: string | null; quantity: number; line_total_iqd: number }[];
};

export function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("n");
    if (n) setOrderNumber(n);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setMessage(null);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_number: orderNumber, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setResult(data);
      else {
        setResult(null);
        if (data.fields) setErrors(data.fields);
        setMessage(data.message ?? (data.fields ? null : "صار خطأ. حاول مرة ثانية."));
      }
    } catch {
      setMessage("الاتصال انقطع. حاول مرة ثانية.");
    }
    setLoading(false);
  }

  const stepIndex = result ? CUSTOMER_FLOW.indexOf(result.status) : -1;

  return (
    <div className="mt-10 grid gap-10 md:grid-cols-12">
      <form onSubmit={submit} noValidate className="md:col-span-5">
        <div className="grid gap-5 rounded-[var(--radius-card)] border hairline bg-paper p-6">
          <div>
            <label htmlFor="t-number" className="field-label">رقم الطلب</label>
            <input id="t-number" className="field text-right uppercase" dir="ltr" placeholder="KK-AB12CD" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} aria-invalid={errors.order_number ? true : undefined} aria-describedby={errors.order_number ? "t-number-e" : undefined} autoComplete="off" maxLength={12} />
            {errors.order_number && <p id="t-number-e" className="field-error">{errors.order_number}</p>}
          </div>
          <div>
            <label htmlFor="t-phone" className="field-label">رقم الهاتف المستخدم بالطلب</label>
            <input id="t-phone" className="field text-right" dir="ltr" type="tel" inputMode="tel" autoComplete="tel" placeholder="07XX XXX XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={errors.phone ? true : undefined} aria-describedby={errors.phone ? "t-phone-e" : undefined} maxLength={20} />
            {errors.phone && <p id="t-phone-e" className="field-error">{errors.phone}</p>}
          </div>
          {message && <p role="alert" className="rounded-xl bg-danger/5 px-4 py-3 text-sm text-danger">{message}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <><SpinnerIcon /> جاري البحث…</> : "اعرض حالة الطلب"}
          </button>
          <p className="text-xs leading-relaxed text-muted">لحماية معلوماتك، نطلب رقم الطلب ورقم الهاتف سوية.</p>
        </div>
      </form>

      <div className="md:col-span-7" aria-live="polite">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key={result.order_number + result.status} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="latin text-3xl tracking-wider text-forest" dir="ltr">{result.order_number}</p>
                <p className="text-sm text-muted">{formatDateTime(result.created_at)}</p>
              </div>
              <p className="mt-3 text-lg text-cocoa/85">{STATUS_CUSTOMER_HINT[result.status]}</p>

              {result.status === "cancelled" ? (
                <p className="mt-8 inline-block rounded-full bg-cocoa/8 px-4 py-2 text-sm font-medium text-cocoa">{STATUS_LABELS.cancelled}</p>
              ) : (
                <ol className="mt-8 grid gap-0">
                  {CUSTOMER_FLOW.map((s, i) => {
                    const done = i <= stepIndex;
                    const current = i === stepIndex;
                    return (
                      <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
                        {i < CUSTOMER_FLOW.length - 1 && (
                          <span className={cn("absolute top-8 right-[0.9rem] h-[calc(100%-2rem)] w-px", i < stepIndex ? "bg-forest" : "bg-cocoa/12")} aria-hidden="true" />
                        )}
                        <motion.span
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 + i * 0.08 }}
                          className={cn("relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs", done ? "border-forest bg-forest text-ivory" : "border-cocoa/20 bg-ivory text-muted", current && "ring-4 ring-forest/15")}
                        >
                          {done ? <CheckIcon size={14} /> : i + 1}
                        </motion.span>
                        <span className={cn("pt-0.5 text-[0.9375rem]", current ? "font-medium text-forest" : done ? "text-cocoa" : "text-muted")}>
                          {STATUS_LABELS[s]}
                          {current && <span className="sr-only"> (الحالة الحالية)</span>}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}

              <ul className="mt-10 divide-y divide-cocoa/8 border-t hairline">
                {result.items.map((i, idx) => (
                  <li key={idx} className="flex justify-between gap-3 py-3 text-sm">
                    <span><span className="latin text-base text-forest">{i.name}</span>{i.option && <span className="text-xs text-muted"> · {i.option}</span>} <span className="text-muted tabular-nums">× {i.quantity}</span></span>
                    <span className="price">{formatIQD(i.line_total_iqd)}</span>
                  </li>
                ))}
                <li className="flex justify-between py-3 text-sm"><span className="text-muted">مجموع المنتجات</span><span className="price">{formatIQD(result.subtotal_iqd)}</span></li>
                <li className="flex justify-between py-3 text-sm"><span className="text-muted">التوصيل</span><span className="price">{result.delivery_fee_iqd === null ? "يتحدد بعد التواصل" : formatIQD(result.delivery_fee_iqd)}</span></li>
                {result.delivery_fee_iqd !== null && (
                  <li className="flex justify-between py-3 font-medium"><span>المجموع الكلي</span><span className="price text-forest">{formatIQD(result.subtotal_iqd + result.delivery_fee_iqd)}</span></li>
                )}
              </ul>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full min-h-48 items-center justify-center rounded-[var(--radius-card)] border border-dashed border-cocoa/15 p-8 text-center text-muted">
              اكتب رقم الطلب ورقم الهاتف حتى تشوف وين وصل طلبك.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
