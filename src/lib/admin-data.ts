import "server-only";
import { sql } from "./db";
import type { OrderStatus } from "./constants";
import type { Category, OrderItemRow, OrderRow } from "./types";

export async function getDashboard() {
  const db = sql();
  const [counts] = await db<
    { new: number; confirmed: number; preparing: number; out_for_delivery: number; delivered: number; cancelled: number; today: number; total: number }[]
  >`select
      count(*) filter (where status = 'new')::int as new,
      count(*) filter (where status = 'confirmed')::int as confirmed,
      count(*) filter (where status = 'preparing')::int as preparing,
      count(*) filter (where status = 'out_for_delivery')::int as out_for_delivery,
      count(*) filter (where status = 'delivered')::int as delivered,
      count(*) filter (where status = 'cancelled')::int as cancelled,
      count(*) filter (where created_at >= date_trunc('day', now() at time zone 'Asia/Baghdad') at time zone 'Asia/Baghdad')::int as today,
      count(*)::int as total
    from public.orders`;
  const [sales] = await db<{ products: number; delivery: number }[]>`
    select coalesce(sum(subtotal_iqd), 0)::int as products, coalesce(sum(delivery_fee_iqd), 0)::int as delivery
      from public.orders where status = 'delivered'`;
  const top = await db<{ name: string; qty: number; revenue: number }[]>`
    select i.product_name as name, sum(i.quantity)::int as qty, sum(i.line_total_iqd)::int as revenue
      from public.order_items i join public.orders o on o.id = i.order_id
     where o.status <> 'cancelled'
     group by i.product_name order by qty desc, revenue desc limit 6`;
  const recent = await db<OrderRow[]>`
    select o.*, (select coalesce(sum(quantity), 0)::int from public.order_items where order_id = o.id) as item_count
      from public.orders o order by o.created_at desc limit 8`;
  return { counts, sales, top, recent };
}

export async function listOrders({ status, q, page }: { status?: OrderStatus | "active"; q?: string; page: number }) {
  const db = sql();
  const limit = 25;
  const offset = (Math.max(page, 1) - 1) * limit;
  const term = q?.trim() ? `%${q.trim().replace(/[%_\\]/g, "\\$&")}%` : null;
  const statusFilter =
    status === "active"
      ? db`and o.status in ('new','confirmed','preparing','out_for_delivery')`
      : status
        ? db`and o.status = ${status}`
        : db``;
  const searchFilter = term
    ? db`and (o.order_number ilike ${term} or o.phone ilike ${term} or o.customer_name ilike ${term} or o.area ilike ${term})`
    : db``;
  const rows = await db<(OrderRow & { total_count: number })[]>`
    select o.*, (select coalesce(sum(quantity), 0)::int from public.order_items where order_id = o.id) as item_count,
           count(*) over()::int as total_count
      from public.orders o
     where true ${statusFilter} ${searchFilter}
     order by o.created_at desc
     limit ${limit} offset ${offset}`;
  return { rows, total: rows[0]?.total_count ?? 0, limit };
}

export async function getOrder(id: string) {
  const db = sql();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [order] = await db<OrderRow[]>`select * from public.orders where id = ${id}`;
  if (!order) return null;
  const items = await db<OrderItemRow[]>`
    select id, product_id, product_name, option_name, unit_price_iqd, quantity, line_total_iqd
      from public.order_items where order_id = ${id} order by product_name`;
  const history = await db<{ status: OrderStatus; changed_at: string; email: string | null }[]>`
    select h.status, h.changed_at, a.email
      from public.order_status_history h left join public.admin_users a on a.user_id = h.changed_by
     where h.order_id = ${id} order by h.changed_at`;
  return { order, items, history };
}

export type AdminProduct = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string | null;
  short_description: string | null;
  description: string | null;
  price_iqd: number;
  category_id: string | null;
  category_name: string | null;
  image_url: string | null;
  image_alt: string | null;
  serving_note: string | null;
  weight_text: string | null;
  pieces_text: string | null;
  filling_text: string | null;
  is_visible: boolean;
  is_sold_out: boolean;
  is_featured: boolean;
  sort_order: number;
  gallery_urls: string[];
  order_count: number;
};

export async function listAdminProducts() {
  const db = sql();
  return db<AdminProduct[]>`
    select p.*, c.name_ar as category_name,
           (select count(*)::int from public.order_items i where i.product_id = p.id) as order_count
      from public.products p left join public.product_categories c on c.id = p.category_id
     order by p.sort_order, p.created_at`;
}

export async function getAdminProduct(id: string) {
  const db = sql();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [p] = await db<AdminProduct[]>`
    select p.*, c.name_ar as category_name, 0 as order_count
      from public.products p left join public.product_categories c on c.id = p.category_id where p.id = ${id}`;
  if (!p) return null;
  const options = await db<{ id: string; name: string; price_delta_iqd: number; is_available: boolean; sort_order: number }[]>`
    select id, name, price_delta_iqd, is_available, sort_order from public.product_options
     where product_id = ${id} order by sort_order, created_at`;
  return { product: p, options };
}

export async function listAllCategories() {
  const db = sql();
  return db<(Category & { sort_order: number })[]>`
    select id, slug, name_ar, name_en, sort_order from public.product_categories order by sort_order, name_ar`;
}

export async function getAdminSettings() {
  const db = sql();
  const [s] = await db`
    select *, to_char(open_time, 'HH24:MI') as open_time_text, to_char(close_time, 'HH24:MI') as close_time_text,
           public.store_is_open() as is_open
      from public.store_settings where id = 1`;
  return s as Record<string, unknown> & { is_open: boolean; open_time_text: string | null; close_time_text: string | null };
}
