-- 0002 — product photo gallery + safety check + owner's product photos (idempotent)

alter table public.products
  add column if not exists gallery_urls text[] not null default '{}';
do $$ begin
  alter table public.products add constraint products_gallery_max check (cardinality(gallery_urls) <= 8);
exception when duplicate_object then null; end $$;
-- A product can only be visible to customers once it has a real price.
do $$ begin
  alter table public.products add constraint products_visible_needs_price check (not is_visible or price_iqd > 0);
exception when duplicate_object then null; end $$;

-- (Photo assignments and the Lotus/Red Velvet products are handled by 0003 and seed.sql.)
