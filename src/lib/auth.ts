import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase/server";
import { sql } from "./db";

export type Admin = { id: string; email: string | null };

/**
 * Authoritative admin check: validates the session with Supabase Auth
 * (server round-trip, so revoked sessions fail) AND requires a row in admin_users.
 */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    const db = sql();
    const rows = await db<{ user_id: string }[]>`select user_id from public.admin_users where user_id = ${data.user.id}`;
    if (!rows.length) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  } catch (e) {
    console.error("[auth] getAdmin failed", e);
    return null;
  }
});

export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
