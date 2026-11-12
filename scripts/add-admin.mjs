// Grants admin access to an existing Supabase Auth user.
// 1) Create the user: Supabase → Authentication → Users → Add user (email + strong password)
// 2) Run: DATABASE_URL=... node scripts/add-admin.mjs owner@example.com
import postgres from "postgres";

const email = process.argv[2];
const url = process.env.DATABASE_URL;
if (!email || !url) { console.error("Usage: DATABASE_URL=... node scripts/add-admin.mjs <email>"); process.exit(1); }
const sql = postgres(url, { prepare: false, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require", max: 1 });
try {
  const rows = await sql`insert into public.admin_users (user_id, email)
                         select id, email from auth.users where lower(email) = lower(${email})
                         on conflict (user_id) do nothing returning user_id`;
  const exists = await sql`select 1 from public.admin_users a join auth.users u on u.id = a.user_id where lower(u.email) = lower(${email})`;
  if (!exists.length) console.error(`No auth user with email ${email}. Create it in Supabase → Authentication first.`);
  else console.log(rows.length ? `✓ ${email} is now an admin` : `✓ ${email} was already an admin`);
} finally {
  await sql.end();
}
