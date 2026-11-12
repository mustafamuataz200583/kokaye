"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CheckIcon, CopyIcon, WhatsappIcon } from "@/components/ui/Icons";
import { formatIQD } from "@/lib/format";

type Summary = {
  order_number: string;
  subtotal_iqd: number;
  first_name?: string;
  items: { name: string; option: string | null; quantity: number }[];
};

export function OrderSuccess({ whatsapp }: { whatsapp: string }) {
  const [number, setNumber] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("n");
    const valid = n && /^KK-[A-Z2-9]{6}$/.test(n) ? n : null;
    setNumber(valid);
    try {
      const raw = sessionStorage.getItem("kokaye-last-order");
      if (raw) {
        const s = JSON.parse(raw) as Summary;
        if (s.order_number === valid) setSummary(s);
      }
    } catch {}
  }, []);

  const copy = async () => {
    if (!number) return;
    try {
      await navigator.clipboard.writeText(number);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = number;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const message = [
    `مرحبا كوكاية، سويت طلب من الموقع.`,
    `رقم الطلب: ${number ?? ""}`,
    ...(summary?.items?.length ? ["", ...summary.items.map((i) => `• ${i.name}${i.option ? ` (${i.option})` : ""} × ${i.quantity}`)] : []),
    ...(summary ? ["", `مجموع المنتجات: ${formatIQD(summary.subtotal_iqd)} (بدون التوصيل)`] : []),
  ].join("\n");
  const waLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;

  return (
    <div className="mx-auto max-w-xl text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-forest text-ivory"
      >
        <motion.span initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}>
          <CheckIcon size={34} />
        </motion.span>
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6 }} className="mt-8 text-4xl md:text-5xl">
        طلبك وصلنا بنجاح!
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-4 text-lg text-cocoa/80">
        راح نتواصل وياك حتى نأكد التفاصيل والتوصيل.
      </motion.p>

      {number && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }} className="mt-10 rounded-[var(--radius-card)] border hairline bg-paper p-6">
          <p className="text-sm text-muted">رقم الطلب</p>
          <p className="latin mt-1 text-4xl tracking-[0.08em] text-forest" dir="ltr" data-testid="order-number">{number}</p>
          <button type="button" onClick={copy} className="btn btn-ghost btn-sm mt-4">
            {copied ? <><CheckIcon size={16} /> تم النسخ</> : <><CopyIcon size={16} /> نسخ رقم الطلب</>}
          </button>
          <p className="mt-4 text-xs text-muted">احتفظ بالرقم حتى تتابع حالة طلبك.</p>
        </motion.div>
      )}

      {summary && summary.items.length > 0 && (
        <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }} className="mt-6 divide-y divide-cocoa/8 text-right">
          {summary.items.map((i, idx) => (
            <li key={idx} className="flex justify-between py-2.5 text-sm">
              <span className="latin text-base text-forest">{i.name}{i.option ? <span className="font-sans text-xs text-muted"> · {i.option}</span> : null}</span>
              <span className="tabular-nums text-muted">× {i.quantity}</span>
            </li>
          ))}
          <li className="flex justify-between py-3 text-sm">
            <span className="text-muted">مجموع المنتجات (بدون التوصيل)</span>
            <span className="price text-cocoa">{formatIQD(summary.subtotal_iqd)}</span>
          </li>
        </motion.ul>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }} className="mt-8 grid gap-3 sm:grid-cols-2">
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
          <WhatsappIcon size={18} /> أرسل الملخص على واتساب
        </a>
        <Link href={number ? `/track?n=${number}` : "/track"} className="btn btn-ghost">تتبع طلبك</Link>
      </motion.div>
      <p className="mt-6 text-xs text-muted">طلبك محفوظ عدنا — حتى لو سديت الصفحة.</p>
      <Link href="/menu" className="mt-8 inline-block text-sm font-medium text-forest link-underline">رجوع للمنيو</Link>
    </div>
  );
}
