-- 0003 — menu cleanup requested by the owner (2026-11-12). Idempotent.
--  * Molten Cookie and Tiramisu Cookies removed permanently.
--  * Products without a photo (Kinder Cookies, Mini Cookies) removed.
--  * Lotus / Red Velvet priced like the other single cookies (2,500 IQD) and shown.
--  * New unified studio photos (v3).
-- Past orders are NOT affected: order_items keep their own name/price snapshot.

delete from public.products
 where slug in ('molten-cookie', 'tiramisu-cookies', 'kinder-cookies', 'mini-cookies');

-- Older installs may not have these two yet.
insert into public.products (slug, name_en, short_description, price_iqd, category_id, is_visible, sort_order)
select v.slug, v.name_en, v.descr, 2500, (select id from public.product_categories where slug = 'special'), false, v.ord
  from (values ('lotus-cookies', 'Lotus Cookies', 'بنكهة اللوتس.', 4),
               ('red-velvet-cookies', 'Red Velvet Cookies', 'بنكهة الريد فلفت.', 5)) as v(slug, name_en, descr, ord)
 where exists (select 1 from public.product_categories where slug = 'special')
on conflict (slug) do nothing;

update public.products p set
  image_url    = v.img,
  image_alt    = v.alt,
  gallery_urls = v.gallery,
  sort_order   = v.ord,
  is_featured  = v.featured,
  category_id  = coalesce((select id from public.product_categories where slug = v.cat), p.category_id)
from (values
  ('classic-cookies',        '/images/products/classic-v3.webp',        'Classic Cookie من كوكاية',          array[]::text[],                                   1, true,  'classic'),
  ('dark-chocolate-cookies', '/images/products/dark-chocolate-v3.webp', 'Dark Chocolate Cookie من كوكاية',   array['/images/products/dark-chocolate-cut-v3.webp'], 2, false, 'classic'),
  ('pistachio-cookies',      '/images/products/pistachio-v3.webp',      'Pistachio Cookie مقطوعة من كوكاية', array[]::text[],                                   3, true,  'special'),
  ('lotus-cookies',          '/images/products/lotus-v3.webp',          'Lotus Cookie من كوكاية',            array[]::text[],                                   4, false, 'special'),
  ('red-velvet-cookies',     '/images/products/red-velvet-v3.webp',     'Red Velvet Cookie من كوكاية',       array[]::text[],                                   5, true,  'special'),
  ('scoop-cookies',          '/images/products/scoop-v3.webp',          'Scoop Cookies بالصينية من كوكاية',  array[]::text[],                                   6, false, 'sharing')
) as v(slug, img, alt, gallery, ord, featured, cat)
where p.slug = v.slug;

-- Price the new cookies like the other single cookies, then show them.
update public.products set price_iqd = 2500 where slug in ('lotus-cookies', 'red-velvet-cookies') and price_iqd = 0;
update public.products set is_visible = true where slug in ('lotus-cookies', 'red-velvet-cookies') and price_iqd > 0;
