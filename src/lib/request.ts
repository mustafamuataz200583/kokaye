import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { sql } from "./db";

export async function clientFingerprint(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const salt = process.env.RATE_LIMIT_SALT ?? "kokaye";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** Returns true if allowed. Fails open only if the limiter itself errors. */
export async function rateLimit(name: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const fp = await clientFingerprint();
    const db = sql();
    const [row] = await db<{ ok: boolean }[]>`
      select public.hit_rate_limit(${`${name}:${fp}`}, ${limit}, ${windowSeconds}) as ok`;
    return row.ok;
  } catch (e) {
    console.error("[rate-limit] error", e);
    return true;
  }
}

/** Basic CSRF defense for JSON endpoints: reject cross-site browser requests. */
export async function isSameOrigin(): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) return true; // non-browser or same-origin navigations without Origin
  const host = h.get("x-forwarded-host") ?? h.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
