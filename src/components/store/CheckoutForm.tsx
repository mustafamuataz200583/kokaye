"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "./CartProvider";
import { ChevronIcon, SpinnerIcon, TruckIcon } from "@/components/ui/Icons";
import { GOVERNORATES } from "@/lib/constants";
import { checkoutSchema, fieldErrors } from "@/lib/validation";
import { cn, formatIQD } from "@/lib/format";

type Fields = {
  customer_name: string;
  phone: string;
  governorate: string;
  area: string;
  address: string;
  landmark: string;
  notes: string;
};

const EMPTY: Fields = { customer_name: "", phone: "", governorate: "بغداد", area: "", address: "", landmark: "", notes: "" };
const KEY_STORE = "kokaye-checkout-key";
const DRAFT_STORE = "kokaye-checkout-draft";

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  const b = (globalThis.crypto as Crypto).getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Same cart → same key, so a retried submit can never create a second order. */
function idempotencyKeyFor(signature: string) {
  try {
    const raw = sessionStorage.getItem(KEY_STORE);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved.sig === signature && typeof saved.key === "string") return saved.key as string;
    }
    const key = uuid();
    sessionStorage.setItem(KEY_STORE, JSON.stringify({ sig: signature, key }));
    return key;
  } catch {
    return uuid();
  }
}

export function CheckoutForm() {
  const router = useRouter();
  const { items, hydrated, refreshQuote, quote, quoteState, clear, remove } = useCart();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const submittingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const signature = useMemo(() => items.map((i) => `${i.key}x${i.quantity}`).sort().join("|"), [items]);

  useEffect(() => {
    if (hydrated && items.length) void refreshQuote();
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // restore a draft (so a refresh doesn't lose typed info) — stays in this tab only
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_STORE);
      if (raw) setFields({ ...EMPTY, ...JSON.parse(raw) });
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_STORE, JSON.stringify(fields));
    } catch {}
  }, [fields]);

  const lines = quote?.lines ?? [];
  const unavailable = lines.filter((l) => !l.available);
  const subtotal = quote ? quote.subtotal_iqd : items.reduce((n, i) => n + i.unit_price_iqd * i.quantity, 0);
  const isClosed = quote ? !quote.is_open : false;

  const payload = (key: string) => ({
    idempotency_key: key,
    ...fields,
    items: items.map((i) => ({ product_id: i.product_id, option_id: i.option_id, quantity: i.quantity })),
    company: (formRef.current?.elements.namedItem("company") as HTMLInputElement | null)?.value ?? "",
  });

  const validate = (all = false) => {
    const r = checkoutSchema.safeParse(payload("00000000-0000-4000-8000-000000000000"));
    const errs = r.success ? {} : fieldErrors(r.error);
    if (all) return errs;
    return Object.fromEntries(Object.entries(errs).filter(([k]) => touched[k]));
  };

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFields((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: "" }));
  };
  const blur = (k: keyof Fields) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    const r = checkoutSchema.safeParse(payload("00000000-0000-4000-8000-000000000000"));
    if (!r.success) {
      const errs = fieldErrors(r.error);
      setErrors((x) => ({ ...x, [k]: errs[k] ?? "" }));
    } else setErrors((x) => ({ ...x, [k]: "" }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return; // double-tap guard
    setFormError(null);
    const errs = validate(true);
    const fieldErrs = Object.fromEntries(Object.entries(errs).filter(([k]) => k !== "items"));
    if (Object.keys(fieldErrs).length) {
      setErrors(fieldErrs);
      setTouched(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, true])));
      const first = Object.keys(EMPTY).find((k) => fieldErrs[k]);
      if (first) document.getElementById(`f-${first}`)?.focus();
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    const key = idempotencyKeyFor(signature);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(key)),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        try {
          sessionStorage.setItem(
            "kokaye-last-order",
            JSON.stringify({
              order_number: data.order_number,
              subtotal_iqd: data.subtotal_iqd,
              first_name: fields.customer_name.trim().split(/\s+/)[0],
              items: (quote?.lines ?? []).filter((l) => l.available).map((l) => ({ name: l.name, option: l.option_name, quantity: l.quantity })),
            }),
          );
          sessionStorage.removeItem(KEY_STORE);
          sessionStorage.removeItem(DRAFT_STORE);
        } catch {}
        clear();
        router.replace(`/order/success?n=${encodeURIComponent(data.order_number)}`);
        return;
      }
      if (data.error === "validation" && data.fields) {
        setErrors(data.fields);
        setFormError(data.message ?? "تأكد من المعلومات المكتوبة.");
      } else if (data.error === "items_unavailable") {
        await refreshQuote();
        setFormError(data.message);
      } else {
        setFormError(data.message ?? "صار خطأ. حاول مرة ثانية.");
      }
    } catch {
      setFormError("الاتصال انقطع وما تأكدنا إذا وصل الطلب. اضغط تأكيد الطلب مرة ثانية — ما راح ينسجل مرتين.");
    }
    submittingRef.current = false;
    setSubmitting(false);
  }

  if (!hydrated) return <div className="mt-10 grid gap-4 md:grid-cols-2">{[0, 1].map((i) => <div key={i} className="skeleton h-72 rounded-3xl" />)}</div>;

  if (items.length === 0) {
    return (
      <div className="mt-12 rounded-[var(--radius-card)] border hairline bg-paper/60 px-6 py-16 text-center">
        <p className="text-xl font-medium text-forest">سلتك فارغة</p>
        <p className="mt-2 text-muted">أضف منتجات من المنيو حتى تكمل الطلب.</p>
        <Link href="/menu" className="btn btn-primary mt-6">تصفح المنيو</Link>
      </div>
    );
  }

  const err = (k: string) => (errors[k] ? errors[k] : "");
  const fieldProps = (k: keyof Fields) => ({
    id: `f-${k}`,
    name: k,
    value: fields[k],
    onChange: set(k),
    onBlur: blur(k),
    "aria-invalid": err(k) ? (true as const) : undefined,
    "aria-describedby": err(k) ? `e-${k}` : undefined,
    className: "field",
  });
  const renderErr = (k: string) => (
    <AnimatePresence>
      {err(k) && (
        <motion.p id={`e-${k}`} className="field-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {err(k)}
        </motion.p>
      )}
    </AnimatePresence>
  );

  const Summary = (
    <div className="rounded-[var(--radius-card)] border hairline bg-paper p-5 md:p-6">
      <ul className="divide-y divide-cocoa/8">
        {(lines.length ? lines : items.map((i) => ({ key: i.key, name: i.name, option_name: i.option_name, quantity: i.quantity, unit_price_iqd: i.unit_price_iqd, available: !i.unavailable, image_url: i.image_url, reason: undefined }))).map((l) => (
          <li key={l.key} className="flex items-center gap-3 py-3">
            <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-studio">
              {l.image_url && <Image src={l.image_url} alt="" fill sizes="48px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="latin truncate text-[1.05rem] leading-tight text-forest">{l.name}</p>
              {l.option_name && <p className="text-xs text-muted">{l.option_name}</p>}
              <p className="text-xs text-muted tabular-nums">× {l.quantity}</p>
              {!l.available && (
                <button type="button" onClick={() => remove(l.key)} className="mt-1 text-xs font-medium text-danger underline">
                  غير متوفر — احذفه
                </button>
              )}
            </div>
            <span className={cn("price text-sm", !l.available && "text-muted line-through")}>
              {l.unit_price_iqd !== null ? formatIQD(l.unit_price_iqd * l.quantity) : "—"}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid gap-2 border-t hairline pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">مجموع المنتجات</span>
          <span className="price text-cocoa">{quoteState === "loading" && !quote ? "…" : formatIQD(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">التوصيل</span>
          <span className="text-cocoa">يتحدد بعد التواصل</span>
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between border-t hairline pt-4">
        <span className="font-medium text-cocoa">المجموع الحالي <span className="text-xs font-normal text-muted">(بدون التوصيل)</span></span>
        <span className="price text-xl text-forest">{formatIQD(subtotal)}</span>
      </div>
      <p className="mt-4 flex gap-2.5 rounded-xl bg-sand/70 px-4 py-3 text-xs leading-relaxed text-cocoa/80">
        <TruckIcon size={18} className="shrink-0 text-forest" />
        {quote?.delivery_note ?? "اجور التوصيل تتحدد بعد التواصل وياك وتاكيد عنوان الطلب."}
      </p>
    </div>
  );

  return (
    <div className="mt-8 grid gap-8 md:mt-10 md:grid-cols-12 md:gap-12">
      {/* Summary — collapsible on mobile, sticky aside on desktop */}
      <aside className="md:order-2 md:col-span-5">
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setSummaryOpen((v) => !v)}
            aria-expanded={summaryOpen}
            className="flex w-full items-center justify-between rounded-2xl border hairline bg-paper px-5 py-4"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-forest">
              ملخص الطلب ({items.reduce((n, i) => n + i.quantity, 0)})
              <ChevronIcon size={16} className={cn("transition-transform duration-300", summaryOpen && "rotate-180")} />
            </span>
            <span className="price text-forest">{formatIQD(subtotal)}</span>
          </button>
          <AnimatePresence initial={false}>
            {summaryOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                <div className="pt-3">{Summary}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="hidden md:sticky md:top-28 md:block">
          <h2 className="mb-4 text-xl">ملخص الطلب</h2>
          {Summary}
        </div>
      </aside>

      <form ref={formRef} onSubmit={onSubmit} noValidate className="md:order-1 md:col-span-7" aria-describedby={formError ? "form-error" : undefined}>
        {isClosed && (
          <div className="mb-6 rounded-2xl bg-forest px-5 py-4 text-sm text-ivory" role="alert">{quote?.closed_message}</div>
        )}

        <fieldset className="grid gap-5">
          <legend className="mb-1 text-xl font-bold text-forest font-[family-name:var(--font-display)]">معلوماتك</legend>
          <div>
            <label htmlFor="f-customer_name" className="field-label">الاسم الكامل</label>
            <input {...fieldProps("customer_name")} autoComplete="name" required maxLength={80} />
            {renderErr("customer_name")}
          </div>
          <div>
            <label htmlFor="f-phone" className="field-label">رقم الهاتف</label>
            <input {...fieldProps("phone")} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="07XX XXX XXXX" className="field text-right" required maxLength={20} />
            {renderErr("phone")}
          </div>
        </fieldset>

        <fieldset className="mt-10 grid gap-5">
          <legend className="mb-1 text-xl font-bold text-forest font-[family-name:var(--font-display)]">عنوان التوصيل</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="f-governorate" className="field-label">المحافظة</label>
              <select {...fieldProps("governorate")} required>
                {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              {renderErr("governorate")}
            </div>
            <div>
              <label htmlFor="f-area" className="field-label">المنطقة</label>
              <input {...fieldProps("area")} autoComplete="address-level2" placeholder="مثلاً: المنصور" required maxLength={80} />
              {renderErr("area")}
            </div>
          </div>
          <div>
            <label htmlFor="f-address" className="field-label">العنوان بالتفصيل</label>
            <input {...fieldProps("address")} autoComplete="street-address" placeholder="الشارع، الزقاق، رقم الدار" required maxLength={300} />
            {renderErr("address")}
          </div>
          <div>
            <label htmlFor="f-landmark" className="field-label">أقرب نقطة دالة <span className="font-normal text-muted">(اختياري)</span></label>
            <input {...fieldProps("landmark")} maxLength={200} />
            {renderErr("landmark")}
          </div>
          <div>
            <label htmlFor="f-notes" className="field-label">ملاحظات على الطلب <span className="font-normal text-muted">(اختياري)</span></label>
            <textarea {...fieldProps("notes")} rows={3} maxLength={500} />
            {renderErr("notes")}
          </div>
          {/* honeypot */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>Company<input name="company" tabIndex={-1} autoComplete="off" defaultValue="" /></label>
          </div>
        </fieldset>

        <AnimatePresence>
          {formError && (
            <motion.p id="form-error" role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8 rounded-2xl border border-danger/25 bg-danger/5 px-5 py-4 text-sm text-danger">
              {formError}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mt-8">
          <dl className="mb-4 grid gap-1.5 rounded-2xl bg-sand/60 px-5 py-4 text-sm" data-testid="checkout-totals">
            <div className="flex justify-between"><dt className="text-muted">مجموع المنتجات</dt><dd className="price text-cocoa">{formatIQD(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">التوصيل</dt><dd className="text-cocoa">يتحدد بعد التواصل وياك</dd></div>
          </dl>
          <button type="submit" className="btn btn-primary h-14 w-full text-base" disabled={submitting || isClosed || unavailable.length > 0}>
            {submitting ? (<><SpinnerIcon /> جاري تأكيد الطلب…</>) : "تأكيد الطلب"}
          </button>
          <p className="mt-3 text-center text-xs leading-relaxed text-muted">
            بعد التأكيد راح نتواصل وياك حتى نأكد التفاصيل وأجور التوصيل.
            {" "}بتأكيد الطلب توافق على <Link href="/terms" className="underline">الشروط</Link> و<Link href="/privacy" className="underline">سياسة الخصوصية</Link>.
          </p>
        </div>
      </form>
    </div>
  );
}
