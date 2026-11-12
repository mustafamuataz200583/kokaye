import { NextResponse } from "next/server";
import { quoteCart } from "@/lib/catalog";
import { quoteSchema } from "@/lib/validation";
import { isSameOrigin, rateLimit } from "@/lib/request";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await isSameOrigin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!(await rateLimit("quote", 120, 60))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  try {
    const quote = await quoteCart(parsed.data.items);
    return NextResponse.json(quote, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[quote] failed", e);
    return NextResponse.json({ error: "server_error" }, { status: 503 });
  }
}
