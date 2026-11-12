import { z } from "zod";
import { GOVERNORATES, MAX_LINES, MAX_QTY_PER_LINE } from "./constants";
import { normalizeIraqiPhone, toLatinDigits } from "./phone";

const clean = (max: number) =>
  z
    .string()
    .transform((v) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim())
    .pipe(z.string().max(max));

export const cartLineSchema = z.object({
  product_id: z.string().uuid(),
  option_id: z.string().uuid().nullish(),
  quantity: z.number().int().min(1).max(MAX_QTY_PER_LINE),
});

export const quoteSchema = z.object({
  items: z.array(cartLineSchema).max(MAX_LINES),
});

export const checkoutSchema = z.object({
  idempotency_key: z.string().uuid(),
  customer_name: clean(80).pipe(z.string().min(2, "اكتب الاسم الكامل")),
  phone: z
    .string()
    .transform((v, ctx) => {
      const n = normalizeIraqiPhone(v);
      if (!n) {
        ctx.addIssue({ code: "custom", message: "رقم الهاتف لازم يكون عراقي، مثل 07801234567" });
        return z.NEVER;
      }
      return n;
    }),
  governorate: z.enum(GOVERNORATES, { message: "اختار المحافظة" }),
  area: clean(80).pipe(z.string().min(2, "اكتب المنطقة")),
  address: clean(300).pipe(z.string().min(4, "اكتب العنوان بالتفصيل")),
  landmark: clean(200).optional().default(""),
  notes: clean(500).optional().default(""),
  items: z.array(cartLineSchema).min(1, "السلة فارغة").max(MAX_LINES),
  // honeypot: real users never fill this
  company: z.string().max(0).optional(),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;

export const trackSchema = z.object({
  order_number: z
    .string()
    .transform((v) => toLatinDigits(v).toUpperCase().replace(/\s/g, ""))
    .transform((v) => (/^[A-Z2-9]{6}$/.test(v) ? `KK-${v}` : v))
    .pipe(z.string().regex(/^KK-[A-Z2-9]{6}$/, "رقم الطلب يكون بهالشكل: KK-AB12CD")),
  phone: z.string().transform((v, ctx) => {
    const n = normalizeIraqiPhone(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "اكتب رقم الهاتف اللي سجلت بيه الطلب" });
      return z.NEVER;
    }
    return n;
  }),
});

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
