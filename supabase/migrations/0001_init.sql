-- =====================================================================
-- KOKAYE | كوكاية — Database schema (Supabase / PostgreSQL 15+)
-- Run once in Supabase SQL Editor, or via `npm run db:migrate`.
--
-- Security model
--  * Every table has RLS enabled with NO policies for `anon` / `authenticated`
--    and all table privileges are revoked from them. The public anon key
--    therefore cannot read or write anything through the REST API.
--  * The Next.js server talks to Postgres directly (DATABASE_URL, server-only)
--    and performs the sensitive operations through the functions below.
--  * Admin identity comes from Supabase Auth; authorization is the
--    `admin_users` table, checked on the server for every admin request.
-- =====================================================================

-- gen_random_uuid() is built into PostgreSQL 13+, no extension needed.

-- ---------- Types ----------------------------------------------------
do $$ begin
  create type public.order_status as enum
    ('new','confirmed','preparing','out_for_delivery','delivered','cancelled');
exception when duplicate_object then null; end $$;

-- ---------- updated_at helper ---------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- ---------- Categories ----------------------------------------------
create table if not exists public.product_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_ar     text not null check (char_length(name_ar) between 1 and 60),
  name_en     text check (char_length(name_en) <= 60),
  sort_order  integer not null default 0,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Products ------------------------------------------------
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en           text not null check (char_length(name_en) between 1 and 80),
  name_ar           text check (char_length(name_ar) <= 80),
  short_description text check (char_length(short_description) <= 160),
  description       text check (char_length(description) <= 2000),
  price_iqd         integer not null check (price_iqd between 0 and 10000000),
  category_id       uuid references public.product_categories(id) on delete set null,
  image_url         text check (char_length(image_url) <= 600),
  image_alt         text check (char_length(image_alt) <= 160),
  -- Optional facts. Leave NULL until confirmed by the owner — never guessed.
  serving_note      text check (char_length(serving_note) <= 120),
  weight_text       text check (char_length(weight_text) <= 60),
  pieces_text       text check (char_length(pieces_text) <= 60),
  filling_text      text check (char_length(filling_text) <= 160),
  is_visible        boolean not null default true,
  is_sold_out       boolean not null default false,
  is_featured       boolean not null default false,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_sort_idx on public.products(sort_order, created_at);

-- Optional extras. The storefront shows options ONLY when rows exist here.
create table if not exists public.product_options (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references public.products(id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 60),
  price_delta_iqd  integer not null default 0 check (price_delta_iqd between 0 and 1000000),
  is_available     boolean not null default true,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists product_options_product_idx on public.product_options(product_id);

-- ---------- Orders --------------------------------------------------
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique check (order_number ~ '^KK-[A-Z2-9]{6}$'),
  idempotency_key   uuid not null unique,
  status            public.order_status not null default 'new',
  customer_name     text not null check (char_length(customer_name) between 2 and 80),
  phone             text not null check (phone ~ '^07[0-9]{9}$'),
  governorate       text not null check (char_length(governorate) between 2 and 40),
  area              text not null check (char_length(area) between 2 and 80),
  address           text not null check (char_length(address) between 4 and 300),
  landmark          text check (char_length(landmark) <= 200),
  notes             text check (char_length(notes) <= 500),
  subtotal_iqd      integer not null check (subtotal_iqd >= 0),
  delivery_fee_iqd  integer check (delivery_fee_iqd between 0 and 1000000), -- NULL = not decided yet
  admin_notes       text check (char_length(admin_notes) <= 1000),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  status_changed_at timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_phone_idx on public.orders(phone);

create table if not exists public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  option_id       uuid references public.product_options(id) on delete set null,
  -- Snapshot at purchase time: later price / name edits never change old orders.
  product_name    text not null,
  option_name     text,
  unit_price_iqd  integer not null check (unit_price_iqd >= 0),
  quantity        integer not null check (quantity between 1 and 50),
  line_total_iqd  integer generated always as (unit_price_iqd * quantity) stored
);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists order_items_product_idx on public.order_items(product_id);

create table if not exists public.order_status_history (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders(id) on delete cascade,
  status      public.order_status not null,
  changed_by  uuid,             -- auth.users.id of the admin (NULL = customer/system)
  changed_at  timestamptz not null default now()
);
create index if not exists order_status_history_order_idx on public.order_status_history(order_id);

-- ---------- Store settings (single row) -----------------------------
create table if not exists public.store_settings (
  id                     smallint primary key default 1 check (id = 1),
  phone                  text not null default '07807784994',
  whatsapp_international text not null default '9647807784994' check (whatsapp_international ~ '^[0-9]{8,15}$'),
  location_text          text not null default 'بغداد — العراق',
  contact_note           text,
  order_hours_text       text not null default '',
  accepting_orders       boolean not null default true,
  enforce_hours          boolean not null default false,
  open_time              time,          -- Asia/Baghdad
  close_time             time,          -- Asia/Baghdad (may be past midnight)
  closed_message         text not null default 'استقبال الطلبات متوقف حالياً. تقدر تتصفح المنيو وترجع تطلب بعدين.',
  delivery_note          text not null default 'اجور التوصيل تتحدد بعد التواصل وياك وتاكيد عنوان الطلب.',
  delivery_area_text     text not null default '',
  instagram_url          text,
  tiktok_url             text,
  facebook_url           text,
  snapchat_url           text,
  privacy_text           text not null default '',
  terms_text             text not null default '',
  updated_at             timestamptz not null default now()
);

-- ---------- Admins --------------------------------------------------
create table if not exists public.admin_users (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  email       text,
  created_at  timestamptz not null default now()
);

-- ---------- Rate limiting -------------------------------------------
create table if not exists public.rate_limits (
  bucket        text not null,
  window_start  timestamptz not null,
  hits          integer not null default 0,
  primary key (bucket, window_start)
);

-- ---------- Triggers ------------------------------------------------
drop trigger if exists t_categories_touch on public.product_categories;
create trigger t_categories_touch before update on public.product_categories
  for each row execute function public.touch_updated_at();
drop trigger if exists t_products_touch on public.products;
create trigger t_products_touch before update on public.products
  for each row execute function public.touch_updated_at();
drop trigger if exists t_orders_touch on public.orders;
create trigger t_orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
drop trigger if exists t_settings_touch on public.store_settings;
create trigger t_settings_touch before update on public.store_settings
  for each row execute function public.touch_updated_at();

-- =====================================================================
-- Functions
-- =====================================================================

-- Fixed-window rate limiter. Returns TRUE when the request is allowed.
create or replace function public.hit_rate_limit(p_bucket text, p_limit int, p_window_seconds int)
returns boolean language plpgsql as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits int;
begin
  insert into public.rate_limits as r (bucket, window_start, hits)
  values (p_bucket, v_window, 1)
  on conflict (bucket, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;
  -- opportunistic cleanup
  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;
  return v_hits <= p_limit;
end $$;

-- Is the store accepting orders right now? (toggle + optional hours, Asia/Baghdad)
create or replace function public.store_is_open() returns boolean
language plpgsql stable as $$
declare s public.store_settings; v_now time;
begin
  select * into s from public.store_settings where id = 1;
  if not found then return false; end if;
  if not s.accepting_orders then return false; end if;
  if not s.enforce_hours or s.open_time is null or s.close_time is null then return true; end if;
  v_now := (now() at time zone 'Asia/Baghdad')::time;
  if s.open_time <= s.close_time then
    return v_now >= s.open_time and v_now < s.close_time;
  else -- window crosses midnight, e.g. 16:00 → 02:00
    return v_now >= s.open_time or v_now < s.close_time;
  end if;
end $$;

-- Unambiguous order numbers: KK-XXXXXX (no 0/O/1/I), ~887M combinations.
create or replace function public.generate_order_number() returns text
language plpgsql volatile as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea := uuid_send(gen_random_uuid()); -- bytes 0..5 are fully random
  result text := 'KK-';
begin
  for i in 0..5 loop
    result := result || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return result;
end $$;

-- ---------------------------------------------------------------------
-- place_order: the ONLY way an order is created.
-- Input (jsonb):
-- { idempotency_key, customer_name, phone, governorate, area, address,
--   landmark?, notes?, items: [{ product_id, option_id?, quantity }] }
-- Prices always come from the database. The browser only sends ids + qty.
-- Returns jsonb { ok, order_number?, error?, details? }
-- ---------------------------------------------------------------------
create or replace function public.place_order(p jsonb) returns jsonb
language plpgsql as $$
declare
  v_key        uuid;
  v_existing   public.orders;
  v_order_id   uuid;
  v_number     text;
  v_subtotal   integer := 0;
  v_item       jsonb;
  v_qty        integer;
  v_prod       public.products;
  v_opt        public.product_options;
  v_lines      jsonb := '[]'::jsonb;
  v_problems   jsonb := '[]'::jsonb;
  v_line       jsonb;
  v_unit       integer;
  v_attempt    int := 0;
  v_seen       text[] := '{}';
  v_line_key   text;
begin
  -- serialize order creation per idempotency key (protects against double-click races)
  begin
    v_key := (p->>'idempotency_key')::uuid;
  exception when others then
    return jsonb_build_object('ok', false, 'error', 'invalid_request');
  end;
  if v_key is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_request');
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_key::text, 0));

  select * into v_existing from public.orders where idempotency_key = v_key;
  if found then
    if v_existing.phone = (p->>'phone') then
      return jsonb_build_object('ok', true, 'order_number', v_existing.order_number,
                                'subtotal_iqd', v_existing.subtotal_iqd, 'duplicate', true);
    end if;
    return jsonb_build_object('ok', false, 'error', 'invalid_request');
  end if;

  if not public.store_is_open() then
    return jsonb_build_object('ok', false, 'error', 'store_closed');
  end if;

  if jsonb_typeof(p->'items') <> 'array' or jsonb_array_length(p->'items') = 0 then
    return jsonb_build_object('ok', false, 'error', 'empty_cart');
  end if;
  if jsonb_array_length(p->'items') > 30 then
    return jsonb_build_object('ok', false, 'error', 'too_many_items');
  end if;

  for v_item in select * from jsonb_array_elements(p->'items') loop
    begin
      v_qty := (v_item->>'quantity')::int;
    exception when others then v_qty := null; end;
    if v_qty is null or v_qty < 1 or v_qty > 50 then
      return jsonb_build_object('ok', false, 'error', 'invalid_quantity');
    end if;

    begin
      select * into v_prod from public.products where id = (v_item->>'product_id')::uuid;
    exception when others then
      return jsonb_build_object('ok', false, 'error', 'invalid_request');
    end;

    if not found or not v_prod.is_visible then
      v_problems := v_problems || jsonb_build_object('product_id', v_item->>'product_id', 'reason', 'unavailable');
      continue;
    end if;
    if v_prod.is_sold_out then
      v_problems := v_problems || jsonb_build_object('product_id', v_prod.id, 'name', v_prod.name_en, 'reason', 'sold_out');
      continue;
    end if;

    v_unit := v_prod.price_iqd;
    v_opt := null;
    if coalesce(v_item->>'option_id', '') <> '' then
      begin
        select * into v_opt from public.product_options
         where id = (v_item->>'option_id')::uuid and product_id = v_prod.id;
      exception when others then
        return jsonb_build_object('ok', false, 'error', 'invalid_request');
      end;
      if not found or not v_opt.is_available then
        v_problems := v_problems || jsonb_build_object('product_id', v_prod.id, 'name', v_prod.name_en, 'reason', 'option_unavailable');
        continue;
      end if;
      v_unit := v_unit + v_opt.price_delta_iqd;
    end if;

    v_line_key := v_prod.id::text || ':' || coalesce(v_opt.id::text, '');
    if v_line_key = any(v_seen) then
      return jsonb_build_object('ok', false, 'error', 'duplicate_line');
    end if;
    v_seen := v_seen || v_line_key;

    v_subtotal := v_subtotal + v_unit * v_qty;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_prod.id, 'option_id', v_opt.id,
      'product_name', v_prod.name_en, 'option_name', v_opt.name,
      'unit_price_iqd', v_unit, 'quantity', v_qty);
  end loop;

  if jsonb_array_length(v_problems) > 0 then
    return jsonb_build_object('ok', false, 'error', 'items_unavailable', 'details', v_problems);
  end if;

  -- insert order with a unique random number (retry on the rare collision)
  loop
    v_attempt := v_attempt + 1;
    v_number := public.generate_order_number();
    begin
      insert into public.orders (order_number, idempotency_key, customer_name, phone, governorate,
                                 area, address, landmark, notes, subtotal_iqd)
      values (v_number, v_key,
              btrim(p->>'customer_name'), p->>'phone', btrim(p->>'governorate'),
              btrim(p->>'area'), btrim(p->>'address'),
              nullif(btrim(coalesce(p->>'landmark', '')), ''),
              nullif(btrim(coalesce(p->>'notes', '')), ''),
              v_subtotal)
      returning id into v_order_id;
      exit;
    exception when unique_violation then
      if v_attempt >= 5 then raise; end if;
    end;
  end loop;

  for v_line in select * from jsonb_array_elements(v_lines) loop
    insert into public.order_items (order_id, product_id, option_id, product_name, option_name, unit_price_iqd, quantity)
    values (v_order_id, (v_line->>'product_id')::uuid, nullif(v_line->>'option_id', '')::uuid,
            v_line->>'product_name', v_line->>'option_name',
            (v_line->>'unit_price_iqd')::int, (v_line->>'quantity')::int);
  end loop;

  insert into public.order_status_history (order_id, status) values (v_order_id, 'new');

  return jsonb_build_object('ok', true, 'order_number', v_number, 'subtotal_iqd', v_subtotal);
end $$;

-- ---------------------------------------------------------------------
-- track_order: requires BOTH order number and the phone used on the order.
-- Returns only what the customer needs. Same "not_found" for any mismatch.
-- ---------------------------------------------------------------------
create or replace function public.track_order(p_order_number text, p_phone text) returns jsonb
language plpgsql stable as $$
declare o public.orders;
begin
  select * into o from public.orders
   where order_number = upper(btrim(p_order_number)) and phone = p_phone;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  return jsonb_build_object(
    'ok', true,
    'order_number', o.order_number,
    'status', o.status,
    'created_at', o.created_at,
    'status_changed_at', o.status_changed_at,
    'customer_first_name', split_part(o.customer_name, ' ', 1),
    'subtotal_iqd', o.subtotal_iqd,
    'delivery_fee_iqd', o.delivery_fee_iqd,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
                'name', i.product_name, 'option', i.option_name,
                'quantity', i.quantity, 'unit_price_iqd', i.unit_price_iqd,
                'line_total_iqd', i.line_total_iqd) order by i.product_name)
              from public.order_items i where i.order_id = o.id), '[]'::jsonb)
  );
end $$;

-- Admin status change with history
create or replace function public.set_order_status(p_order_id uuid, p_status public.order_status, p_admin uuid)
returns void language plpgsql as $$
begin
  update public.orders set status = p_status, status_changed_at = now()
   where id = p_order_id and status <> p_status;
  if found then
    insert into public.order_status_history (order_id, status, changed_by) values (p_order_id, p_status, p_admin);
  end if;
end $$;

-- =====================================================================
-- Row Level Security — lock everything away from the public API
-- =====================================================================
alter table public.product_categories   enable row level security;
alter table public.products             enable row level security;
alter table public.product_options      enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;
alter table public.store_settings       enable row level security;
alter table public.admin_users          enable row level security;
alter table public.rate_limits          enable row level security;

do $$
declare r text;
begin
  foreach r in array array['anon','authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on all tables in schema public from %I', r);
      execute format('revoke all on all sequences in schema public from %I', r);
      execute format('revoke execute on all functions in schema public from %I', r);
      execute format('alter default privileges in schema public revoke all on tables from %I', r);
      execute format('alter default privileges in schema public revoke execute on functions from %I', r);
    end if;
  end loop;
end $$;
revoke execute on all functions in schema public from public;

-- Default settings row
insert into public.store_settings (id) values (1) on conflict (id) do nothing;

-- =====================================================================
-- Storage bucket for product photos (public read; writes only via the
-- server with the service-role key). Skipped where storage isn't present.
-- =====================================================================
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
    on conflict (id) do nothing;
  end if;
end $$;
