import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { checkoutSchema, fieldErrors } from "@/lib/validation";
import { isSameOrigin, rateLimit } from "@/lib/request";

export const dynamic = "force-dynamic";

type PlaceOrderResult =
  | { ok: true; order_number: string; subtotal_iqd: number; duplicate?: boolean }
  | { ok: false; error: string; details?: Array<{ product_id: string; name?: string; reason: string }> };

const MESSAGES: Record<string, string> = {
  store_closed: "استقبال الطلبات متوقف حالياً.",
  empty_cart: "السلة فارغة.",
  too_many_items: "عدد المنتجات بالسلة كبير. قلل العدد وحاول مرة ثانية.",
  invalid_quantity: "الكمية مو صحيحة.",
  items_unavailable: "بعض المنتجات صارت غير متوفرة. حدثنا السلة إلك.",
  duplicate_line: "صار تكرار بالسلة. حدث الصفحة وحاول مرة ثانية.",
  invalid_request: "صار خطأ بالطلب. حدث الصفحة وحاول مرة ثانية.",
};

export async function POST(req: Request) {
  if (!(await isSameOrigin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request", message: MESSAGES.invalid_request }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", message: "تأكد من المعلومات المكتوبة.", fields: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }
  const input = parsed.data;
  if (input.company) {
    // honeypot triggered — reject quietly without storing anything
    return NextResponse.json({ error: "invalid_request", message: MESSAGES.invalid_request }, { status: 400 });
  }

  if (!(await rateLimit("order", 8, 600))) {
    return NextResponse.json(
      { error: "rate_limited", message: "وصلنا طلبات كثيرة من نفس الجهاز. انتظر شوي وحاول، أو تواصل ويانا على واتساب." },
      { status: 429 },
    );
  }

  try {
    const db = sql();
    const payload = {
      idempotency_key: input.idempotency_key,
      customer_name: input.customer_name,
      phone: input.phone,
      governorate: input.governorate,
      area: input.area,
      address: input.address,
      landmark: input.landmark,
      notes: input.notes,
      items: input.items.map((i) => ({ product_id: i.product_id, option_id: i.option_id ?? null, quantity: i.quantity })),
    };
    const [row] = await db<{ result: PlaceOrderResult }[]>`select public.place_order(${db.json(payload)}) as result`;
    const result = row.result;
    if (!result.ok) {
      const status = result.error === "store_closed" ? 409 : result.error === "items_unavailable" ? 409 : 400;
      return NextResponse.json(
        { error: result.error, message: MESSAGES[result.error] ?? MESSAGES.invalid_request, details: result.details ?? [] },
        { status },
      );
    }
    return NextResponse.json(
      { ok: true, order_number: result.order_number, subtotal_iqd: result.subtotal_iqd },
      { status: result.duplicate ? 200 : 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("[orders] place_order failed", e);
    return NextResponse.json(
      { error: "server_error", message: "ما قدرنا نحفظ الطلب هسه. حاول مرة ثانية بعد لحظات — طلبك ما انحفظ." },
      { status: 503 },
    );
  }
}
