-- =====================================================================
-- KOKAYE seed: approved menu, prices (IQD) and photos. Safe to re-run.
-- Run AFTER all migrations. Descriptions intentionally make no claims about
-- weight, pieces or fillings — fill those from the admin panel once confirmed.
-- =====================================================================
insert into public.product_categories (slug, name_ar, name_en, sort_order) values
  ('classic',  'الكلاسيك',            'Classic Cookies',     1),
  ('special',  'نكهات خاصة',          'Special Flavors',     2),
  ('sharing',  'للمشاركة والحلويات',  'Sharing & Desserts',  3)
on conflict (slug) do nothing;

insert into public.products
  (slug, name_en, short_description, price_iqd, category_id, image_url, image_alt, gallery_urls, is_featured, sort_order)
values
  ('classic-cookies',        'Classic Cookies',        'الطعم اللي تبدي بيه وترجعله كل مرة.', 2500, (select id from public.product_categories where slug='classic'), '/images/products/classic-v3.webp',        'Classic Cookie من كوكاية',          '{}',                                             true,  1),
  ('dark-chocolate-cookies', 'Dark Chocolate Cookies', 'لمحبين الشوكولاتة الداكنة.',          2500, (select id from public.product_categories where slug='classic'), '/images/products/dark-chocolate-v3.webp', 'Dark Chocolate Cookie من كوكاية',   array['/images/products/dark-chocolate-cut-v3.webp'], false, 2),
  ('pistachio-cookies',      'Pistachio Cookies',      'بنكهة الفستق.',                       2500, (select id from public.product_categories where slug='special'), '/images/products/pistachio-v3.webp',      'Pistachio Cookie مقطوعة من كوكاية', '{}',                                             true,  3),
  ('lotus-cookies',          'Lotus Cookies',          'بنكهة اللوتس.',                       2500, (select id from public.product_categories where slug='special'), '/images/products/lotus-v3.webp',          'Lotus Cookie من كوكاية',            '{}',                                             false, 4),
  ('red-velvet-cookies',     'Red Velvet Cookies',     'بنكهة الريد فلفت.',                   2500, (select id from public.product_categories where slug='special'), '/images/products/red-velvet-v3.webp',     'Red Velvet Cookie من كوكاية',       '{}',                                             true,  5),
  ('scoop-cookies',          'Scoop Cookies',          'حلوى للمشاركة.',                      7000, (select id from public.product_categories where slug='sharing'), '/images/products/scoop-v3.webp',          'Scoop Cookies بالصينية من كوكاية',  '{}',                                             false, 6)
on conflict (slug) do nothing;
