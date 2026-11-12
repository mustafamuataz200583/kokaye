"use client";

import { useFormAction } from "./useFormAction";

import { saveSettings, type ActionState } from "@/app/admin/actions";
import { SpinnerIcon } from "@/components/ui/Icons";
import { DEFAULT_PRIVACY, DEFAULT_TERMS } from "@/lib/legal";

type S = Record<string, unknown>;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="grid gap-5 rounded-2xl border hairline bg-paper p-5"><h2 className="text-lg">{title}</h2>{children}</section>;
}

export function SettingsForm({ s }: { s: S }) {
  const [state, onSubmit, pending] = useFormAction(saveSettings);
  const f = state.fields ?? {};
  const str = (k: string) => (s[k] as string | null) ?? "";
  const input = (k: string, label: string, o: { hint?: string; dir?: "ltr"; type?: string; placeholder?: string; defaultValue?: string } = {}) => (
    <div>
      <label htmlFor={`s-${k}`} className="field-label">{label}</label>
      <input id={`s-${k}`} name={k} type={o.type ?? "text"} dir={o.dir} placeholder={o.placeholder} className={`field ${o.dir ? "text-right" : ""}`} defaultValue={o.defaultValue ?? str(k)} aria-invalid={f[k] ? true : undefined} />
      {f[k] ? <p className="field-error">{f[k]}</p> : o.hint ? <p className="mt-1 text-xs text-muted">{o.hint}</p> : null}
    </div>
  );
  const area = (k: string, label: string, hint?: string, placeholder?: string) => (
    <div>
      <label htmlFor={`s-${k}`} className="field-label">{label}</label>
      <textarea id={`s-${k}`} name={k} className="field" rows={k.endsWith("_text") && (k === "privacy_text" || k === "terms_text") ? 10 : 3} defaultValue={str(k)} placeholder={placeholder} aria-invalid={f[k] ? true : undefined} />
      {f[k] ? <p className="field-error">{f[k]}</p> : hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Card title="استقبال الطلبات">
        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
          <span><span className="font-medium">استقبال الطلبات مفعّل</span><span className="block text-xs text-muted">إذا طفيته، يظهر تنويه للزبائن ويتوقف إتمام الطلبات.</span></span>
          <input type="checkbox" name="accepting_orders" defaultChecked={Boolean(s.accepting_orders)} className="h-5 w-5 accent-[var(--color-forest)]" />
        </label>
        {input("order_hours_text", "نص أوقات الاستقبال", { hint: "يظهر للزبون، مثل: يومياً من 4 العصر لـ 11 الليل" })}
        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
          <span><span className="font-medium">إغلاق تلقائي خارج الأوقات</span><span className="block text-xs text-muted">بتوقيت بغداد. يدعم أوقات تعبر نص الليل.</span></span>
          <input type="checkbox" name="enforce_hours" defaultChecked={Boolean(s.enforce_hours)} className="h-5 w-5 accent-[var(--color-forest)]" />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          {input("open_time", "يفتح الساعة", { type: "time", dir: "ltr", defaultValue: (s.open_time_text as string) ?? "" })}
          {input("close_time", "يغلق الساعة", { type: "time", dir: "ltr", defaultValue: (s.close_time_text as string) ?? "" })}
        </div>
        {area("closed_message", "رسالة الإغلاق للزبائن")}
      </Card>

      <Card title="التواصل">
        <div className="grid gap-5 sm:grid-cols-2">
          {input("phone", "رقم الهاتف", { dir: "ltr" })}
          {input("whatsapp_international", "رقم واتساب الدولي", { dir: "ltr", hint: "بدون + مثل 9647807784994" })}
        </div>
        {input("location_text", "الموقع")}
        {area("contact_note", "نص صفحة التواصل", "اختياري")}
      </Card>

      <Card title="التوصيل">
        {area("delivery_note", "نص أجور التوصيل", "يظهر بالسلة وإكمال الطلب")}
        {input("delivery_area_text", "مناطق التوصيل", { hint: "اختياري — اكتبه فقط إذا مؤكد" })}
        <p className="text-xs text-muted">أجور التوصيل لكل طلب تتحدد من صفحة الطلب نفسه بعد التواصل ويا الزبون.</p>
      </Card>

      <Card title="السوشيال ميديا">
        <p className="-mt-3 text-xs text-muted">اتركها فارغة حتى ما تظهر.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          {input("instagram_url", "Instagram", { dir: "ltr", placeholder: "https://instagram.com/…" })}
          {input("tiktok_url", "TikTok", { dir: "ltr", placeholder: "https://tiktok.com/@…" })}
          {input("facebook_url", "Facebook", { dir: "ltr", placeholder: "https://facebook.com/…" })}
          {input("snapchat_url", "Snapchat", { dir: "ltr", placeholder: "https://snapchat.com/add/…" })}
        </div>
      </Card>

      <Card title="الخصوصية والشروط">
        <p className="-mt-3 text-xs leading-relaxed text-muted">إذا تركتها فارغة يظهر نص مبدئي (مسودة). راجع النص قبل النشر. سطر فارغ = فقرة جديدة، والسطر القصير بأول الفقرة يصير عنوان.</p>
        {area("privacy_text", "سياسة الخصوصية", undefined, DEFAULT_PRIVACY.slice(0, 160) + "…")}
        {area("terms_text", "الشروط", undefined, DEFAULT_TERMS.slice(0, 160) + "…")}
      </Card>

      <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t hairline bg-ivory/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-2xl md:border">
        <button className="btn btn-primary" disabled={pending}>{pending ? <><SpinnerIcon /> جاري الحفظ…</> : "حفظ الإعدادات"}</button>
        {state.message && <span className="text-sm text-forest" role="status">{state.message}</span>}
        {state.error && <span className="text-sm text-danger" role="alert">{state.error}</span>}
      </div>
    </form>
  );
}
