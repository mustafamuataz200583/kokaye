// Applies supabase/migrations/*.sql (and optionally seed.sql) using DATABASE_URL.
// Usage: node scripts/migrate.mjs [--seed]
import { readFileSync, readdirSync } from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is required"); process.exit(1); }
const sql = postgres(url, { prepare: false, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require", max: 1, onnotice: () => {} });
const dir = new URL("../supabase/migrations/", import.meta.url);
try {
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    console.log("→", f);
    await sql.unsafe(readFileSync(new URL(f, dir), "utf8"));
  }
  if (process.argv.includes("--seed")) {
    console.log("→ seed.sql");
    await sql.unsafe(readFileSync(new URL("../supabase/seed.sql", import.meta.url), "utf8"));
  }
  console.log("done");
} finally {
  await sql.end();
}
