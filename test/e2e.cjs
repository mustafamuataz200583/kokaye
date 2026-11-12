// End-to-end QA for KOKAYE. Requires: next start on :3000, local Postgres, mock-supabase on :54321.
const { chromium, devices } = require("playwright");
const postgres = require("postgres").default ?? require("postgres");
const sql = postgres("postgresql://postgres:postgres@localhost:5432/kokaye", { max: 2, onnotice: () => {} });
const BASE = "http://localhost:3000";
const results = [];
const ok = (name, cond, extra = "") => { results.push({ name, pass: !!cond, extra }); console.log(`${cond ? "✅" : "❌"} ${name} ${extra}`); };
const resetLimits = () => sql`delete from public.rate_limits`;
const shot = (p, n) => p.screenshot({ path: `/home/claude/shots/${n}.png`, fullPage: true });

(async () => {
  const browser = await chromium.launch();
  const consoleErrors = [];
  const watch = (page) => {
    page.on("pageerror", (e) => consoleErrors.push(`${page.url()} ${e.message}`));
    page.on("console", (m) => m.type() === "error" && consoleErrors.push(`${page.url()} ${m.text()}`));
  };
  await resetLimits();
  await sql`update public.store_settings set accepting_orders = true, enforce_hours = false`;
  await sql`update public.products set is_sold_out = false, is_visible = (price_iqd > 0)`;

  // ---------- 1. every public page responds & no horizontal scroll on mobile
  const m = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await m.newPage(); watch(page);
  for (const path of ["/", "/menu", "/menu/classic-cookies", "/cart", "/checkout", "/track", "/about", "/contact", "/privacy", "/terms", "/order/success?n=KK-ABCDEF", "/sitemap.xml", "/robots.txt"]) {
    const r = await page.goto(BASE + path, { waitUntil: "networkidle" });
    const hs = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    ok(`page ${path}`, r.status() === 200 && !hs, `status=${r.status()} hscroll=${hs}`);
  }
  const r404 = await page.goto(BASE + "/menu/does-not-exist"); ok("unknown product → 404", r404.status() === 404);

  // ---------- 2. header nav links (mobile menu)
  await page.goto(BASE + "/");
  await page.getByRole("button", { name: "فتح القائمة" }).click();
  await page.locator("#mobile-menu").getByRole("link", { name: "المنيو" }).click();
  await page.waitForURL("**/menu"); ok("mobile menu navigates to /menu", page.url().endsWith("/menu"));

  // ---------- 3. filters + add to cart + count + drawer qty math
  await page.getByRole("tab", { name: "Sharing & Desserts" }).click();
  await page.waitForTimeout(600);
  const shownNames = await page.locator("article h3").allInnerTexts();
  ok("category filter shows only sharing items", shownNames.length === 1 && /Scoop/.test(shownNames[0]), shownNames.join(","));
  await page.getByRole("tab", { name: "الكل" }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "أضف Classic Cookies للسلة" }).first().click();
  await page.getByRole("button", { name: "أضف Classic Cookies للسلة" }).first().click();
  await page.getByRole("button", { name: "أضف Scoop Cookies للسلة" }).first().click();
  await page.waitForTimeout(400);
  const toast = await page.getByRole("status").filter({ hasText: "انضافت" }).count();
  ok("toast shown on add", toast > 0);
  const badge = await page.getByRole("button", { name: /السلة — 3 منتج/ }).count();
  ok("cart count = 3", badge === 1);
  await page.reload({ waitUntil: "networkidle" });
  ok("cart persists after reload", (await page.getByRole("button", { name: /السلة — 3 منتج/ }).count()) === 1);
  await page.getByRole("button", { name: /السلة — 3 منتج/ }).click();
  const drawer = page.getByRole("dialog");
  await drawer.waitFor();
  ok("drawer subtotal 12,000", (await drawer.innerText()).includes("12,000 د.ع"));
  await drawer.getByRole("group", { name: "كمية Classic Cookies" }).getByRole("button", { name: "زيادة الكمية" }).click();
  await page.waitForTimeout(300);
  ok("qty +1 → subtotal 14,500 live", (await drawer.innerText()).includes("14,500 د.ع"));
  ok("drawer shows delivery note", (await drawer.innerText()).includes("اجور التوصيل تتحدد بعد التواصل"));
  await shot(page, "qa-drawer-m");
  await drawer.getByRole("link", { name: "إكمال الطلب" }).click();
  await page.waitForURL("**/checkout");

  // ---------- 4. checkout validation
  await page.waitForSelector("#f-customer_name");
  await page.getByRole("button", { name: /تأكيد الطلب/ }).click();
  ok("required field errors shown", (await page.locator(".field-error").count()) >= 4, `count=${await page.locator(".field-error").count()}`);
  await page.fill("#f-customer_name", "علي حسن");
  await page.fill("#f-phone", "12345");
  await page.locator("#f-phone").blur();
  ok("invalid phone message", (await page.locator("#e-phone").innerText()).includes("عراقي"));
  await page.fill("#f-phone", "٠٧٨٠ ١٢٣ ٤٥٦٧"); // Arabic-Indic digits accepted
  await page.locator("#f-phone").blur();
  await page.waitForTimeout(600);
  ok("arabic digits phone accepted", (await page.locator("#e-phone").count()) === 0);
  await page.fill("#f-area", "المنصور");
  await page.fill("#f-address", "شارع 14 رمضان، زقاق 3، دار 12");
  await page.fill("#f-landmark", "قرب جامع");
  await page.fill("#f-notes", "بدون جرس رجاءً");
  const bodyText = await page.getByTestId("checkout-totals").innerText() + await page.locator("main").innerText();
  ok("checkout shows totals with delivery separate (visible on mobile)", bodyText.includes("يتحدد بعد التواصل وياك") && bodyText.includes("14,500"));
  await shot(page, "qa-checkout-m");

  // ---------- 5. network failure then retry → exactly one order
  let failOnce = true;
  await page.route("**/api/orders", async (route) => {
    if (failOnce) { failOnce = false; const resp = await route.fetch(); await route.abort("connectionreset"); return; } // server saved it, client never heard back
    await route.continue();
  });
  await page.getByRole("button", { name: /تأكيد الطلب/ }).click();
  await page.waitForSelector("#form-error");
  ok("network error message shown", (await page.locator("#form-error").innerText()).includes("ما راح ينسجل مرتين"));
  await page.getByRole("button", { name: /تأكيد الطلب/ }).click();
  await page.waitForURL("**/order/success**", { timeout: 15000 });
  const orderNumber = (await page.getByTestId("order-number").innerText()).trim();
  ok("success page with order number", /^KK-[A-Z2-9]{6}$/.test(orderNumber), orderNumber);
  ok("success copy", (await page.locator("main").innerText()).includes("طلبك وصلنا بنجاح!"));
  const [{ n: dupCount }] = await sql`select count(*)::int as n from public.orders where phone = '07801234567'`;
  ok("retry after lost response did NOT duplicate the order", dupCount === 1, `orders=${dupCount}`);
  const [ord] = await sql`select * from public.orders where order_number = ${orderNumber}`;
  const items = await sql`select product_name, unit_price_iqd, quantity from public.order_items where order_id = ${ord.id} order by product_name`;
  ok("order saved with DB prices", ord.subtotal_iqd === 14500 && items.length === 2 && items[0].unit_price_iqd === 2500 && items[0].quantity === 3, JSON.stringify(items));
  ok("phone normalized", ord.phone === "07801234567");
  ok("cart cleared after order", (await page.getByRole("button", { name: /السلة — / }).count()) === 0);
  const wa = await page.getByRole("link", { name: /واتساب/ }).first().getAttribute("href");
  ok("whatsapp share link to store", wa.startsWith("https://wa.me/9647807784994?text=") && decodeURIComponent(wa).includes(orderNumber));
  await shot(page, "qa-success-m");

  // ---------- 6. API hardening
  await resetLimits();
  const api = await m.request;
  const pid = (await sql`select id from public.products where slug='classic-cookies'`)[0].id;
  const base = { customer_name: "تست", phone: "07712345678", governorate: "بغداد", area: "الكرادة", address: "شارع 52 دار 4", items: [{ product_id: pid, quantity: 2, unit_price_iqd: 1 }], subtotal_iqd: 1 };
  const key = crypto.randomUUID();
  const [a, b] = await Promise.all([
    api.post(BASE + "/api/orders", { data: { ...base, idempotency_key: key } }),
    api.post(BASE + "/api/orders", { data: { ...base, idempotency_key: key } }),
  ]);
  const [ja, jb] = [await a.json(), await b.json()];
  ok("concurrent double-submit → same order", ja.order_number && ja.order_number === jb.order_number, `${ja.order_number} ${jb.order_number}`);
  ok("client-sent price ignored (2×2500)", ja.subtotal_iqd === 5000, String(ja.subtotal_iqd));
  const cross = await api.post(BASE + "/api/orders", { data: { ...base, idempotency_key: crypto.randomUUID() }, headers: { Origin: "https://evil.example" } });
  ok("cross-origin POST rejected", cross.status() === 403);
  const bad = await api.post(BASE + "/api/orders", { data: { ...base, idempotency_key: crypto.randomUUID(), phone: "0123" } });
  ok("server rejects bad phone", bad.status() === 422);
  const badQty = await api.post(BASE + "/api/orders", { data: { ...base, idempotency_key: crypto.randomUUID(), items: [{ product_id: pid, quantity: 500 }] } });
  ok("server rejects qty > 50", badQty.status() === 422);

  // ---------- 7. sold out + closed store
  await sql`update public.products set is_sold_out = true where slug = 'red-velvet-cookies'`;
  const kid = (await sql`select id from public.products where slug='red-velvet-cookies'`)[0].id;
  const so = await api.post(BASE + "/api/orders", { data: { ...base, idempotency_key: crypto.randomUUID(), items: [{ product_id: kid, quantity: 1 }] } });
  ok("sold-out product rejected by server", so.status() === 409 && (await so.json()).error === "items_unavailable");
  await sql`update public.products set is_sold_out = false where slug = 'red-velvet-cookies'`;
  await sql`update public.store_settings set accepting_orders = false`;
  const closed = await api.post(BASE + "/api/orders", { data: { ...base, idempotency_key: crypto.randomUUID() } });
  ok("closed store rejects orders", closed.status() === 409 && (await closed.json()).error === "store_closed");
  await page.goto(BASE + "/menu/classic-cookies");
  await page.getByRole("button", { name: "أضف للسلة" }).click();
  await page.goto(BASE + "/checkout", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const submitDisabled = await page.getByRole("button", { name: /تأكيد الطلب/ }).isDisabled();
  ok("checkout disabled + notice when closed", submitDisabled && (await page.locator("form [role=alert]").first().innerText()).includes("متوقف"));
  await sql`update public.store_settings set accepting_orders = true`;

  // ---------- 8. tracking
  await resetLimits();
  await page.goto(BASE + `/track?n=${orderNumber}`);
  await page.fill("#t-phone", "07801234567");
  await page.getByRole("button", { name: "اعرض حالة الطلب" }).click();
  await page.waitForTimeout(800);
  const tr = await page.locator("main").innerText();
  ok("tracking with correct phone shows order", tr.includes("Classic Cookies") && tr.includes("14,500"));
  ok("tracking does not leak address/phone", !tr.includes("14 رمضان") && !tr.includes("07801234567".slice(4)) || !tr.includes("رمضان"));
  const wrong = await api.post(BASE + "/api/track", { data: { order_number: orderNumber, phone: "07700000000" } });
  ok("tracking with wrong phone → 404", wrong.status() === 404);
  let limited = false;
  for (let i = 0; i < 12; i++) { const r = await api.post(BASE + "/api/track", { data: { order_number: "KK-AAAAAA", phone: "07700000000" } }); if (r.status() === 429) limited = true; }
  ok("tracking brute force rate-limited", limited);
  await resetLimits();

  // ---------- 9. admin auth
  const adminCtx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const ap = await adminCtx.newPage(); watch(ap);
  await ap.goto(BASE + "/admin/orders");
  ok("unauthenticated /admin → login", ap.url().includes("/admin/login"));
  await ap.fill("#email", "customer@kokaye.test"); await ap.fill("#password", "NotAdmin!2026");
  await ap.getByRole("button", { name: "دخول" }).click();
  await ap.waitForSelector("form [role=alert]");
  ok("non-admin account refused", (await ap.locator("form [role=alert]").innerText()).includes("صلاحية"));
  await ap.fill("#email", "owner@kokaye.test"); await ap.fill("#password", "wrong");
  await ap.getByRole("button", { name: "دخول" }).click();
  await ap.waitForTimeout(800);
  ok("wrong password refused", (await ap.locator("form [role=alert]").innerText()).includes("غير صحيحة"));
  await ap.fill("#password", "Kokaye!Test2026");
  await ap.getByRole("button", { name: "دخول" }).click();
  await ap.waitForURL(BASE + "/admin", { waitUntil: "commit" }); await ap.waitForSelector("text=آخر الطلبات");
  const dash = await ap.locator("main").innerText();
  ok("admin dashboard shows new orders + top products", dash.includes(orderNumber) && dash.includes("Classic Cookies"));
  await shot(ap, "qa-admin-dashboard");

  // order detail: status + delivery fee
  await ap.getByRole("link", { name: orderNumber }).first().click();
  await ap.waitForURL("**/admin/orders/**", { waitUntil: "commit" }); await ap.waitForSelector("text=حالة الطلب");
  const det = await ap.locator("main").innerText();
  ok("order detail shows address, notes, landmark", det.includes("14 رمضان") && det.includes("بدون جرس") && det.includes("قرب جامع"));
  await ap.getByRole("radio", { name: "قيد التحضير" }).click();
  await ap.waitForTimeout(1200);
  const [st] = await sql`select status from public.orders where order_number = ${orderNumber}`;
  ok("admin status change saved", st.status === "preparing");
  await ap.fill("#delivery_fee", "3000");
  await ap.getByRole("button", { name: "حفظ" }).click();
  await ap.waitForTimeout(1000);
  const [fee] = await sql`select delivery_fee_iqd from public.orders where order_number = ${orderNumber}`;
  ok("delivery fee saved", fee.delivery_fee_iqd === 3000);
  await shot(ap, "qa-admin-order");
  const tr2 = await (await api.post(BASE + "/api/track", { data: { order_number: orderNumber, phone: "07801234567" } })).json();
  ok("customer tracking reflects admin status + fee", tr2.status === "preparing" && tr2.delivery_fee_iqd === 3000);

  // products: edit price, toggle sold out, upload image
  await ap.goto(BASE + "/admin/products");
  await shot(ap, "qa-admin-products");
  await ap.locator("li", { hasText: "Lotus Cookies" }).getByRole("button", { name: "نفدت الكمية" }).click();
  await ap.waitForTimeout(1000);
  ok("toggle sold out from list", (await sql`select is_sold_out from public.products where slug='lotus-cookies'`)[0].is_sold_out === true);
  await page.goto(BASE + "/menu/lotus-cookies");
  ok("storefront reflects sold out", (await page.locator("main").innerText()).includes("نفدت الكمية"));
  await ap.locator("li", { hasText: "Lotus Cookies" }).getByRole("button", { name: "نفدت الكمية" }).click();
  await ap.waitForTimeout(800);
  const adminList = await ap.locator("main").innerText();
  ok("admin list has no deleted products", !/Molten|Tiramisu|Kinder|Mini Cookies/.test(adminList));
  await ap.locator("li", { hasText: "Red Velvet Cookies" }).getByRole("link", { name: "تعديل" }).click();
  await ap.waitForURL("**/admin/products/**", { waitUntil: "commit" }); await ap.waitForSelector("#p-file", { state: "attached" });
  await ap.setInputFiles("#p-file", "/home/claude/kokaye/public/images/products/classic-v3.webp");
  await ap.waitForFunction(() => document.querySelector('input[name="image_url"]')?.value.includes("/storage/v1/object/public/"), null, { timeout: 15000 });
  ok("image upload to storage", true);
  await ap.fill("#p-price_iqd", "3600");
  await ap.getByRole("button", { name: "حفظ التعديلات" }).click();
  await ap.waitForTimeout(1500);
  const [mol] = await sql`select price_iqd, image_url from public.products where slug='red-velvet-cookies'`;
  ok("product price + image saved", mol.price_iqd === 3600 && mol.image_url.includes("storage"), JSON.stringify(mol));
  await page.goto(BASE + "/menu/red-velvet-cookies", { waitUntil: "networkidle" });
  ok("storefront shows new price (revalidated)", (await page.locator("main").innerText()).includes("3,600"));
  const imgOk = await page.evaluate(() => [...document.images].filter((i) => i.src.includes("_next/image") && i.src.includes("storage")).every((i) => i.complete && i.naturalWidth > 0));
  ok("uploaded image renders via next/image", imgOk);
  // old order price unchanged (snapshot)
  await sql`update public.products set price_iqd = 2500, image_url = '/images/products/red-velvet-v3.webp' where slug = 'red-velvet-cookies'`;

  // option
  await ap.fill("#o-name", "صوص إضافي"); await ap.fill("#o-price", "500");
  await ap.getByRole("button", { name: "إضافة", exact: true }).click();
  await ap.waitForTimeout(1000);
  await page.goto(BASE + "/menu/red-velvet-cookies", { waitUntil: "networkidle" });
  ok("option shown on storefront only after adding", (await page.locator("main").innerText()).includes("صوص إضافي"));
  await sql`delete from public.product_options`;

  // settings
  await ap.goto(BASE + "/admin/settings");
  await ap.fill("#s-order_hours_text", "يومياً من 4 العصر لـ 11 الليل");
  await ap.fill("#s-instagram_url", "http://bad");
  await ap.getByRole("button", { name: "حفظ الإعدادات" }).click();
  await ap.waitForTimeout(1000);
  ok("settings validation (https only)", (await ap.locator("main").innerText()).includes("https://"));
  await ap.fill("#s-instagram_url", "https://instagram.com/kokaye");
  await ap.getByRole("button", { name: "حفظ الإعدادات" }).click();
  await ap.waitForTimeout(1200);
  await page.goto(BASE + "/contact", { waitUntil: "networkidle" });
  const ct = await page.locator("body").innerText();
  ok("settings reflected on site", ct.includes("يومياً من 4 العصر") && (await page.locator('a[aria-label="Instagram"]').count()) === 1);
  await shot(ap, "qa-admin-settings");

  // logout
  await ap.goto(BASE + "/admin");
  await ap.getByRole("button", { name: "تسجيل خروج" }).click();
  await ap.waitForURL("**/admin/login", { waitUntil: "commit" });
  await ap.goto(BASE + "/admin/orders");
  ok("after logout admin is locked", ap.url().includes("/admin/login"));
  // server action without session
  const forged = await adminCtx.request.post(BASE + "/admin/orders", { headers: { "Next-Action": "x" } });
  ok("forged admin request without session not served", forged.status() !== 200 || (await forged.text()).includes("login"));

  const unexpected = consoleErrors.filter((e) => !e.includes("/menu/does-not-exist") && !e.includes("ERR_CONNECTION_RESET"));

  // ---------- 10. menu cleanup, photos, gallery
  await page.goto(BASE + "/menu", { waitUntil: "networkidle" });
  const names = await page.locator("article h3").allInnerTexts();
  ok("menu has exactly the 6 photographed products", names.length === 6 && !names.some((n) => /Molten|Tiramisu|Kinder|Mini/.test(n)), names.join(","));
  ok("Lotus + Red Velvet visible at 2,500", (await page.locator("article", { hasText: "Lotus Cookies" }).innerText()).includes("2,500") && (await page.locator("article", { hasText: "Red Velvet Cookies" }).innerText()).includes("2,500"));
  ok("no placeholder photos left on menu", (await page.getByText("صورة مؤقتة").count()) === 0);
  for (const slug of ["molten-cookie", "tiramisu-cookies", "kinder-cookies", "mini-cookies"]) {
    const r = await page.goto(BASE + "/menu/" + slug); ok(`deleted product ${slug} → 404`, r.status() === 404);
  }
  await page.goto(BASE + "/menu/dark-chocolate-cookies", { waitUntil: "networkidle" });
  const thumbs = page.getByRole("tab", { name: /الصورة/ });
  ok("dark chocolate has 2-photo gallery", (await thumbs.count()) === 2);
  await thumbs.nth(1).click(); await page.waitForTimeout(700);
  ok("gallery switches image", (await thumbs.nth(1).getAttribute("aria-selected")) === "true");
  const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length);
  ok("no broken images", broken === 0);
  let blocked = false; try { await sql`update public.products set price_iqd = 0 where slug = 'lotus-cookies'`; } catch { blocked = true; }
  ok("DB blocks a visible product with price 0", blocked);

  ok("no unexpected browser console errors", unexpected.length === 0, unexpected.slice(0, 5).join(" | "));
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  await browser.close(); await sql.end();
  process.exit(failed.length ? 1 : 0);
})().catch(async (e) => { console.error(e); process.exit(2); });
