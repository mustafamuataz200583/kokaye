"use client";

import { useFormAction } from "./useFormAction";

import { useRef, useState, useTransition } from "react";
import { saveProduct, uploadProductImage, deleteProduct, type ActionState } from "@/app/admin/actions";
import type { AdminProduct } from "@/lib/admin-data";
import type { Category } from "@/lib/types";
import { SpinnerIcon } from "@/components/ui/Icons";

type Props = { product?: AdminProduct; categories: Category[]; created?: boolean };

export function ProductForm({ product, categories, created }: Props) {
  const [state, onSubmit, pending] = useFormAction(saveProduct);
  const [image, setImage] = useState(product?.image_url ?? "");
  const [gallery, setGallery] = useState<string[]>(product?.gallery_urls ?? []);
  const galleryRef = useRef<HTMLInputElement>(null);
  const onGalleryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const fd = new FormData();
    fd.set("file", file);
    startUpload(async () => {
      const r = await uploadProductImage(fd);
      if (r.url) setGallery((g) => [...g, r.url!].slice(0, 8));
      else setUploadError(r.error ?? "فشل الرفع");
      if (galleryRef.current) galleryRef.current.value = "";
    });
  };
  const [uploading, startUpload] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const f = state.fields ?? {};

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const fd = new FormData();
    fd.set("file", file);
    startUpload(async () => {
      const r = await uploadProductImage(fd);
      if (r.url) setImage(r.url);
      else setUploadError(r.error ?? "فشل الرفع");
      if (fileRef.current) fileRef.current.value = "";
    });
  };

  const text = (name: keyof AdminProduct, label: string, opts: { hint?: string; max?: number; dir?: "ltr"; required?: boolean; area?: boolean } = {}) => (
    <div>
      <label htmlFor={`p-${name}`} className="field-label">{label}{!opts.required && <span className="font-normal text-muted"> (اختياري)</span>}</label>
      {opts.area ? (
        <textarea id={`p-${name}`} name={name} className="field" rows={4} maxLength={opts.max} defaultValue={(product?.[name] as string) ?? ""} aria-invalid={f[name] ? true : undefined} />
      ) : (
        <input id={`p-${name}`} name={name} className={`field ${opts.dir ? "text-right" : ""}`} dir={opts.dir} maxLength={opts.max} required={opts.required} defaultValue={(product?.[name] as string | number | undefined) ?? ""} aria-invalid={f[name] ? true : undefined} />
      )}
      {f[name] ? <p className="field-error">{f[name]}</p> : opts.hint ? <p className="mt-1 text-xs text-muted">{opts.hint}</p> : null}
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-3">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="image_url" value={image} />
      {gallery.map((g) => <input key={g} type="hidden" name="gallery_urls" value={g} />)}

      <div className="grid gap-5 rounded-2xl border hairline bg-paper p-5 lg:col-span-2">
        {(created || state.message) && <p className="rounded-xl bg-forest/8 px-4 py-3 text-sm text-forest" role="status">{state.message ?? "تم إنشاء المنتج"}</p>}
        {state.error && <p className="rounded-xl bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">{state.error}</p>}
        <div className="grid gap-5 sm:grid-cols-2">
          {text("name_en", "اسم المنتج", { required: true, max: 80, dir: "ltr" })}
          {text("name_ar", "الاسم بالعربي", { max: 80 })}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="p-price_iqd" className="field-label">السعر (د.ع)</label>
            <input id="p-price_iqd" name="price_iqd" inputMode="numeric" dir="ltr" className="field text-right" required defaultValue={product?.price_iqd ?? ""} aria-invalid={f.price_iqd ? true : undefined} />
            {f.price_iqd && <p className="field-error">{f.price_iqd}</p>}
          </div>
          <div>
            <label htmlFor="p-category_id" className="field-label">التصنيف</label>
            <select id="p-category_id" name="category_id" className="field" defaultValue={product?.category_id ?? ""}>
              <option value="">بدون تصنيف</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name_ar}{c.name_en ? ` — ${c.name_en}` : ""}</option>)}
            </select>
          </div>
        </div>
        {text("short_description", "وصف مختصر", { max: 160, hint: "يظهر على بطاقة المنتج. سطر واحد." })}
        {text("description", "الوصف الكامل", { max: 2000, area: true, hint: "يظهر بصفحة المنتج. لا تكتب تفاصيل غير مؤكدة." })}
        <fieldset className="grid gap-5 rounded-xl border border-dashed border-cocoa/15 p-4 sm:grid-cols-2">
          <legend className="px-2 text-sm font-medium text-cocoa">معلومات تظهر فقط إذا انكتبت</legend>
          {text("serving_note", "يكفي", { max: 120, hint: "مثل: يكفي شخصين" })}
          {text("weight_text", "الوزن", { max: 60 })}
          {text("pieces_text", "عدد القطع", { max: 60 })}
          {text("filling_text", "الحشوة", { max: 160 })}
        </fieldset>
        {text("slug", "رابط المنتج (slug)", { max: 80, dir: "ltr", hint: "بالإنكليزي، مثل classic-cookies. يتولد تلقائياً إذا تركته فارغ." })}
      </div>

      <div className="grid content-start gap-4">
        <div className="rounded-2xl border hairline bg-paper p-5">
          <p className="field-label">صورة المنتج</p>
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-sand">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full place-items-center px-6 text-center text-xs text-muted">بدون صورة — يظهر للزبون إطار "صورة مؤقتة"</span>
            )}
            {uploading && <span className="absolute inset-0 grid place-items-center bg-ivory/70"><SpinnerIcon size={28} /></span>}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="p-file" onChange={onFile} />
          <div className="mt-3 flex gap-2">
            <label htmlFor="p-file" className="btn btn-ghost btn-sm flex-1 cursor-pointer">{image ? "تغيير الصورة" : "رفع صورة"}</label>
            {image && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setImage("")}>إزالة</button>}
          </div>
          {uploadError && <p className="field-error">{uploadError}</p>}
          <details className="mt-3 text-xs text-muted">
            <summary className="cursor-pointer">أو حط رابط صورة</summary>
            <input className="field mt-2 text-right text-sm" dir="ltr" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://… أو /images/…" />
          </details>
          {f.image_url && <p className="field-error">{f.image_url}</p>}
          <div className="mt-5 border-t hairline pt-4">
            <p className="field-label">صور إضافية <span className="font-normal text-muted">(تظهر بصفحة المنتج — {gallery.length}/8)</span></p>
            {gallery.length > 0 && (
              <ul className="mb-3 grid grid-cols-4 gap-2">
                {gallery.map((g, i) => (
                  <li key={g} className="group relative aspect-[4/5] overflow-hidden rounded-lg bg-sand">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setGallery((x) => x.filter((_, j) => j !== i))} aria-label={`إزالة الصورة ${i + 1}`}
                      className="absolute top-1 left-1 grid h-6 w-6 place-items-center rounded-full bg-ivory/90 text-xs text-danger">×</button>
                  </li>
                ))}
              </ul>
            )}
            <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="p-gallery-file" onChange={onGalleryFile} />
            {gallery.length < 8 && <label htmlFor="p-gallery-file" className="btn btn-ghost btn-sm w-full cursor-pointer">+ إضافة صورة</label>}
          </div>
          <div className="mt-4">{text("image_alt", "وصف الصورة", { max: 160, hint: "لقارئات الشاشة ومحركات البحث" })}</div>
        </div>

        <div className="grid gap-3 rounded-2xl border hairline bg-paper p-5 text-sm">
          {([
            ["is_visible", "ظاهر بالمتجر", product?.is_visible ?? true],
            ["is_sold_out", "نفدت الكمية", product?.is_sold_out ?? false],
            ["is_featured", "مميز بالرئيسية", product?.is_featured ?? false],
          ] as const).map(([name, label, def]) => (
            <label key={name} className="flex cursor-pointer items-center justify-between gap-3">
              {label}
              <input type="checkbox" name={name} defaultChecked={def} className="h-5 w-5 accent-[var(--color-forest)]" />
            </label>
          ))}
        </div>

        <button className="btn btn-primary w-full" disabled={pending || uploading}>{pending ? <><SpinnerIcon /> جاري الحفظ…</> : product ? "حفظ التعديلات" : "إنشاء المنتج"}</button>
        {product && (
          <button
            type="button"
            className="text-sm text-danger hover:underline disabled:opacity-50"
            disabled={deleting}
            onClick={() => {
              if (window.confirm(`حذف ${product.name_en} نهائياً؟ الطلبات القديمة تبقى محفوظة. (الأفضل تخفيه بدل الحذف)`)) startDelete(async () => { await deleteProduct(product.id); });
            }}
          >
            {deleting ? "جاري الحذف…" : "حذف المنتج"}
          </button>
        )}
      </div>
    </form>
  );
}
