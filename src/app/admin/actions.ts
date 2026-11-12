"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/request";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import { normalizeIraqiPhone, toLatinDigits } from "@/lib/phone";

export type ActionState = { ok?: boolean; error?: string; fields?: Record<string, string>; message?: string; id?: string };

function revalidateStore() {
  revalidatePath("/", "layout");
}

const opt = (max: number) =>
  z
    .string()
    .max(max)
    .transform((v) => v.trim())
    .transform((v) => (v === "" ? null : v));

const intField = (min: number, max: number) =>
  z
    .string()
    .transform((v) => toLatinDigits(v).replace(/[,\s]/g, ""))
    .pipe(z.string().regex(/^\d+$/, "اكتب رقم صحيح"))
    .transform(Number)
    .pipe(z.number().int().min(min).max(max));

function isPriceRule(e: unknown) {
  return Boolean(e && typeof e === "object" && "constraint_name" in e && (e as { constraint_name: string }).constraint_name === "products_visible_needs_price");
}

function issues(e: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of e.issues) {
    const k = String(i.path[0] ?? "form");
    out[k] ??= i.message;
  }
  return out;
}

// ---------------------------------------------------------------- auth
export async function signIn(_: ActionState, form: FormData): Promise<ActionState> {
  if (!(await rateLimit("admin-login", 8, 900))) {
    return { error: "محاولات كثيرة. انتظر ربع ساعة وحاول مرة ثانية." };
  }
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "اكتب البريد وكلمة المرور." };

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "البريد أو كلمة المرور غير صحيحة." };

  const db = sql();
  const rows = await db`select 1 from public.admin_users where user_id = ${data.user.id}`;
  if (!rows.length) {
    await supabase.auth.signOut();
    return { error: "هذا الحساب ما عنده صلاحية دخول للوحة التحكم." };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---------------------------------------------------------------- orders
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!ORDER_STATUSES.includes(status) || !z.string().uuid().safeParse(orderId).success) return { error: "طلب غير صالح" };
  const db = sql();
  await db`select public.set_order_status(${orderId}::uuid, ${status}::public.order_status, ${admin.id}::uuid)`;
  revalidatePath("/admin", "layout");
  return { ok: true, message: "تم تحديث الحالة" };
}

const orderMetaSchema = z.object({
  order_id: z.string().uuid(),
  delivery_fee: z
    .string()
    .transform((v) => toLatinDigits(v).replace(/[,\s]/g, ""))
    .pipe(z.union([z.literal(""), z.string().regex(/^\d{1,7}$/, "اكتب مبلغ صحيح")]))
    .transform((v) => (v === "" ? null : Number(v))),
  admin_notes: opt(1000),
});

export async function updateOrderMeta(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = orderMetaSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "تأكد من القيم", fields: issues(parsed.error) };
  const { order_id, delivery_fee, admin_notes } = parsed.data;
  const db = sql();
  await db`update public.orders set delivery_fee_iqd = ${delivery_fee}, admin_notes = ${admin_notes} where id = ${order_id}`;
  revalidatePath("/admin", "layout");
  return { ok: true, message: "تم الحفظ" };
}

// ---------------------------------------------------------------- products
const productSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name_en: z.string().trim().min(1, "اسم المنتج مطلوب").max(80),
  name_ar: opt(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "الرابط بالإنكليزي وأرقام وشرطات فقط، مثل classic-cookies"),
  short_description: opt(160),
  description: opt(2000),
  price_iqd: intField(0, 10_000_000),
  category_id: z.string().uuid().optional().or(z.literal("")).transform((v) => v || null),
  image_url: opt(600).refine((v) => v === null || v.startsWith("/") || /^https:\/\//.test(v) || /^http:\/\/localhost/.test(v), "رابط الصورة غير صالح"),
  image_alt: opt(160),
  serving_note: opt(120),
  weight_text: opt(60),
  pieces_text: opt(60),
  filling_text: opt(160),
  is_visible: z.string().optional().transform((v) => v === "on"),
  is_sold_out: z.string().optional().transform((v) => v === "on"),
  is_featured: z.string().optional().transform((v) => v === "on"),
});

export async function saveProduct(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const raw = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string"));
  if (!raw.slug && typeof raw.name_en === "string") {
    raw.slug = raw.name_en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { error: "تأكد من الحقول المؤشرة", fields: issues(parsed.error) };
  const d = parsed.data;
  const gallery = form
    .getAll("gallery_urls")
    .map((v) => String(v).trim())
    .filter((v) => v && (v.startsWith("/") || /^https:\/\//.test(v) || /^http:\/\/localhost/.test(v)) && v.length <= 600)
    .slice(0, 8);
  const db = sql();
  try {
    if (d.id) {
      await db`
        update public.products set
          name_en = ${d.name_en}, name_ar = ${d.name_ar}, slug = ${d.slug},
          short_description = ${d.short_description}, description = ${d.description},
          price_iqd = ${d.price_iqd}, category_id = ${d.category_id},
          image_url = ${d.image_url}, image_alt = ${d.image_alt},
          serving_note = ${d.serving_note}, weight_text = ${d.weight_text},
          pieces_text = ${d.pieces_text}, filling_text = ${d.filling_text},
          is_visible = ${d.is_visible}, is_sold_out = ${d.is_sold_out}, is_featured = ${d.is_featured},
          gallery_urls = ${gallery}
        where id = ${d.id}`;
      revalidateStore();
      revalidatePath("/admin", "layout");
      return { ok: true, message: "تم حفظ المنتج", id: d.id };
    }
    const [row] = await db<{ id: string }[]>`
      insert into public.products (name_en, name_ar, slug, short_description, description, price_iqd, category_id,
        image_url, image_alt, serving_note, weight_text, pieces_text, filling_text, is_visible, is_sold_out, is_featured, gallery_urls, sort_order)
      values (${d.name_en}, ${d.name_ar}, ${d.slug}, ${d.short_description}, ${d.description}, ${d.price_iqd}, ${d.category_id},
        ${d.image_url}, ${d.image_alt}, ${d.serving_note}, ${d.weight_text}, ${d.pieces_text}, ${d.filling_text},
        ${d.is_visible}, ${d.is_sold_out}, ${d.is_featured}, ${gallery},
        (select coalesce(max(sort_order), 0) + 1 from public.products))
      returning id`;
    revalidateStore();
    revalidatePath("/admin", "layout");
    redirect(`/admin/products/${row.id}?created=1`);
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "23505") {
      return { error: "الرابط (slug) مستخدم لمنتج ثاني", fields: { slug: "مستخدم لمنتج ثاني" } };
    }
    if (isPriceRule(e)) return { error: "حدد سعر المنتج قبل ما تخليه ظاهر بالمتجر", fields: { price_iqd: "لازم يكون أكبر من صفر حتى يظهر" } };
    throw e;
  }
}

export async function toggleProductFlag(id: string, flag: "is_visible" | "is_sold_out" | "is_featured", value: boolean): Promise<ActionState> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return { error: "منتج غير صالح" };
  const db = sql();
  try {
    if (flag === "is_visible") await db`update public.products set is_visible = ${value} where id = ${id}`;
  } catch (e) {
    if (isPriceRule(e)) return { error: "حدد سعر المنتج أولاً — منتج سعره صفر ما يظهر للزبائن" };
    throw e;
  }
  if (flag === "is_sold_out") await db`update public.products set is_sold_out = ${value} where id = ${id}`;
  if (flag === "is_featured") await db`update public.products set is_featured = ${value} where id = ${id}`;
  revalidateStore();
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function moveProduct(id: string, direction: "up" | "down"): Promise<ActionState> {
  await requireAdmin();
  const db = sql();
  await db.begin(async (tx) => {
    const list = await tx<{ id: string }[]>`select id from public.products order by sort_order, created_at for update`;
    const idx = list.findIndex((p) => p.id === id);
    const swap = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swap < 0 || swap >= list.length) return;
    [list[idx], list[swap]] = [list[swap], list[idx]];
    for (let i = 0; i < list.length; i++) {
      await tx`update public.products set sort_order = ${i + 1} where id = ${list[i].id}`;
    }
  });
  revalidateStore();
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionState> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(id).success) return { error: "منتج غير صالح" };
  const db = sql();
  // Past orders keep their own snapshot of name/price (order_items), so history is safe.
  await db`delete from public.products where id = ${id}`;
  revalidateStore();
  revalidatePath("/admin/products");
  redirect("/admin/products?deleted=1");
}

const optionSchema = z.object({
  product_id: z.string().uuid(),
  name: z.string().trim().min(1, "اسم الخيار مطلوب").max(60),
  price_delta_iqd: intField(0, 1_000_000),
});

export async function addOption(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = optionSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "تأكد من الخيار", fields: issues(parsed.error) };
  const d = parsed.data;
  const db = sql();
  await db`insert into public.product_options (product_id, name, price_delta_iqd, sort_order)
           values (${d.product_id}, ${d.name}, ${d.price_delta_iqd},
                   (select coalesce(max(sort_order), 0) + 1 from public.product_options where product_id = ${d.product_id}))`;
  revalidateStore();
  revalidatePath(`/admin/products/${d.product_id}`);
  return { ok: true, message: "انضاف الخيار" };
}

export async function toggleOption(id: string, productId: string, available: boolean): Promise<ActionState> {
  await requireAdmin();
  const db = sql();
  await db`update public.product_options set is_available = ${available} where id = ${id} and product_id = ${productId}`;
  revalidateStore();
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

export async function deleteOption(id: string, productId: string): Promise<ActionState> {
  await requireAdmin();
  const db = sql();
  await db`delete from public.product_options where id = ${id} and product_id = ${productId}`;
  revalidateStore();
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

// ---------------------------------------------------------------- image upload
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
function sniffImage(buf: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image/webp";
  return null;
}

export async function uploadProductImage(form: FormData): Promise<ActionState & { url?: string }> {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "اختار صورة" };
  if (file.size > MAX_IMAGE_BYTES) return { error: "حجم الصورة لازم يكون أقل من 5MB" };
  const buf = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImage(buf);
  if (!mime) return { error: "الصيغ المدعومة: JPG أو PNG أو WEBP" };

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !service) return { error: "رفع الصور يحتاج ضبط SUPABASE_SERVICE_ROLE_KEY. تقدر تحط رابط صورة بدلاً منه." };

  const ext = mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
  const path = `products/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`;
  const res = await fetch(`${base}/storage/v1/object/product-images/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${service}`, apikey: service, "Content-Type": mime, "x-upsert": "false", "cache-control": "31536000" },
    body: buf,
  });
  if (!res.ok) {
    console.error("[upload] storage error", res.status, await res.text().catch(() => ""));
    return { error: "ما قدرنا نرفع الصورة. تأكد من إعداد Storage وحاول مرة ثانية." };
  }
  return { ok: true, url: `${base}/storage/v1/object/public/product-images/${path}` };
}

// ---------------------------------------------------------------- settings
const timeField = z
  .string()
  .transform((v) => v.trim())
  .pipe(z.union([z.literal(""), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "الوقت بصيغة 24 ساعة مثل 16:00")]))
  .transform((v) => (v === "" ? null : v));
const urlField = opt(300).refine((v) => v === null || /^https:\/\/[^\s]+$/.test(v), "الرابط لازم يبدي بـ https://");

const settingsSchema = z.object({
  phone: z.string().transform((v, ctx) => {
    const n = normalizeIraqiPhone(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "رقم هاتف عراقي غير صالح" });
      return z.NEVER;
    }
    return n;
  }),
  whatsapp_international: z
    .string()
    .transform((v) => toLatinDigits(v).replace(/[^\d]/g, ""))
    .pipe(z.string().regex(/^\d{8,15}$/, "الرقم الدولي بدون + مثل 9647807784994")),
  location_text: z.string().trim().min(2).max(120),
  contact_note: opt(300),
  order_hours_text: z.string().trim().max(160),
  accepting_orders: z.string().optional().transform((v) => v === "on"),
  enforce_hours: z.string().optional().transform((v) => v === "on"),
  open_time: timeField,
  close_time: timeField,
  closed_message: z.string().trim().min(4, "اكتب رسالة واضحة").max(300),
  delivery_note: z.string().trim().min(4, "اكتب نص التوصيل").max(300),
  delivery_area_text: z.string().trim().max(200),
  instagram_url: urlField,
  tiktok_url: urlField,
  facebook_url: urlField,
  snapchat_url: urlField,
  privacy_text: z.string().max(8000),
  terms_text: z.string().max(8000),
});

export async function saveSettings(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "تأكد من الحقول المؤشرة", fields: issues(parsed.error) };
  const d = parsed.data;
  if (d.enforce_hours && (!d.open_time || !d.close_time)) {
    return { error: "حدد وقت الفتح والإغلاق أو طفّي تفعيل الأوقات", fields: { open_time: "مطلوب", close_time: "مطلوب" } };
  }
  const db = sql();
  await db`
    update public.store_settings set
      phone = ${d.phone}, whatsapp_international = ${d.whatsapp_international},
      location_text = ${d.location_text}, contact_note = ${d.contact_note},
      order_hours_text = ${d.order_hours_text}, accepting_orders = ${d.accepting_orders},
      enforce_hours = ${d.enforce_hours}, open_time = ${d.open_time}, close_time = ${d.close_time},
      closed_message = ${d.closed_message}, delivery_note = ${d.delivery_note},
      delivery_area_text = ${d.delivery_area_text},
      instagram_url = ${d.instagram_url}, tiktok_url = ${d.tiktok_url},
      facebook_url = ${d.facebook_url}, snapchat_url = ${d.snapchat_url},
      privacy_text = ${d.privacy_text.trim()}, terms_text = ${d.terms_text.trim()}
    where id = 1`;
  revalidateStore();
  revalidatePath("/admin", "layout");
  return { ok: true, message: "تم حفظ الإعدادات" };
}

export async function setAcceptingOrders(value: boolean): Promise<ActionState> {
  await requireAdmin();
  const db = sql();
  await db`update public.store_settings set accepting_orders = ${value} where id = 1`;
  revalidateStore();
  revalidatePath("/admin", "layout");
  return { ok: true };
}
