import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { fieldErrors, trackSchema } from "@/lib/validation";
import { isSameOrigin, rateLimit } from "@/lib/request";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await isSameOrigin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  // Strict limit: prevents guessing order numbers / phones.
  if (!(await rateLimit("track", 10, 600))) {
    return NextResponse.json({ error: "rate_limited", message: "محاولات كثيرة. انتظر شوي وحاول مرة ثانية." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const parsed = trackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", fields: fieldErrors(parsed.error) }, { status: 422 });
  }
  try {
    const db = sql();
    const [row] = await db<{ result: { ok: boolean } & Record<string, unknown> }[]>`
      select public.track_order(${parsed.data.order_number}, ${parsed.data.phone}) as result`;
    if (!row.result.ok) {
      return NextResponse.json(
        { error: "not_found", message: "ما لكينا طلب بهالمعلومات. تأكد من رقم الطلب ورقم الهاتف." },
        { status: 404 },
      );
    }
    return NextResponse.json(row.result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[track] failed", e);
    return NextResponse.json({ error: "server_error", message: "صار خطأ. حاول مرة ثانية." }, { status: 503 });
  }
}
