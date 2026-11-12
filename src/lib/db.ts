import "server-only";
import postgres from "postgres";

/**
 * Server-only Postgres client.
 * Connects with DATABASE_URL (Supabase transaction pooler on Vercel).
 * This connection bypasses RLS, so it must never be imported by client code —
 * the `server-only` import above makes the build fail if that happens.
 */
declare global {
  var __kokayeSql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured. See .env.example and README.");
  }
  const isLocal = /localhost|127\.0\.0\.1/.test(url);
  return postgres(url, {
    prepare: false, // required for Supabase transaction pooler (pgbouncer)
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: isLocal ? false : "require",
    types: { bigint: postgres.BigInt },
  });
}

export function sql() {
  if (!globalThis.__kokayeSql) globalThis.__kokayeSql = createClient();
  return globalThis.__kokayeSql;
}

export function isDbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
