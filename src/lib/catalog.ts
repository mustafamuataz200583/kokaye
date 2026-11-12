import "server-only";
import { cache } from "react";
import { sql } from "./db";
import type { CartLineInput, Category, Product, PublicSettings, Quote, QuoteLine, StoreSettings } from "./types";

const PRODUCT_SELECT = `
  p.id, p.slug, p.name_en, p.name_ar, p.short_description, p.description, p.price_iqd,
  p.category_id, c.slug as category_slug, p.image_url, p.image_alt, p.serving_note,
  p.weight_text, p.pieces_text, p.filling_text, p.is_sold_out, p.is_featured, p.gallery_urls,
  coalesce((select json_agg(json_build_object('id', o.id, 'name', o.name,
              'price_delta_iqd', o.price_delta_iqd, 'is_available', o.is_available)
              order by o.sort_order, o.created_at)
            from public.product_options o where o.product_id = p.id), '[]'::json) as options`;

export const getVisibleProducts = cache(async (): Promise<Product[]> => {
  const db = sql();
  const rows = await db.unsafe(
    `select ${PRODUCT_SELECT}
       from public.products p
       left join public.product_categories c on c.id = p.category_id
      where p.is_visible
      order by p.sort_order, p.created_at`,
  );
  return rows as unknown as Product[];
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const db = sql();
  const rows = await db.unsafe(
    `select ${PRODUCT_SELECT}
       from public.products p
       left join public.product_categories c on c.id = p.category_id
      where p.is_visible and p.slug = $1
      limit 1`,
    [slug],
  );
  return (rows[0] as unknown as Product) ?? null;
});

export const getCategories = cache(async (): Promise<Category[]> => {
  const db = sql();
  const rows = await db<Category[]>`
    select c.id, c.slug, c.name_ar, c.name_en
      from public.product_categories c
     where c.is_visible
       and exists (select 1 from public.products p where p.category_id = c.id and p.is_visible)
     order by c.sort_order, c.name_ar`;
  return rows;
});

export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  const db = sql();
  const [row] = await db<StoreSettings[]>`
    select phone, whatsapp_international, location_text, contact_note, order_hours_text,
           accepting_orders, enforce_hours,
           to_char(open_time, 'HH24:MI') as open_time, to_char(close_time, 'HH24:MI') as close_time,
           closed_message, delivery_note, delivery_area_text, instagram_url, tiktok_url,
           facebook_url, snapchat_url, privacy_text, terms_text, updated_at
      from public.store_settings where id = 1`;
  if (!row) throw new Error("store_settings row missing — run the migration.");
  return row;
});

export const getPublicSettings = cache(async (): Promise<PublicSettings> => {
  const s = await getStoreSettings();
  const db = sql();
  const [{ open }] = await db<{ open: boolean }[]>`select public.store_is_open() as open`;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { privacy_text, terms_text, ...rest } = s;
  return { ...rest, is_open: open };
});

/** Live price + availability check for a cart. Prices always from DB. */
export async function quoteCart(items: CartLineInput[]): Promise<Quote> {
  const db = sql();
  const settings = await getStoreSettings();
  const [{ open }] = await db<{ open: boolean }[]>`select public.store_is_open() as open`;

  const ids = [...new Set(items.map((i) => i.product_id))];
  const products = ids.length
    ? await db<
        {
          id: string;
          slug: string;
          name_en: string;
          image_url: string | null;
          price_iqd: number;
          is_visible: boolean;
          is_sold_out: boolean;
        }[]
      >`select id, slug, name_en, image_url, price_iqd, is_visible, is_sold_out
          from public.products where id = any(${ids}::uuid[])`
    : [];
  const optionIds = [...new Set(items.map((i) => i.option_id).filter(Boolean) as string[])];
  const options = optionIds.length
    ? await db<{ id: string; product_id: string; name: string; price_delta_iqd: number; is_available: boolean }[]>`
        select id, product_id, name, price_delta_iqd, is_available
          from public.product_options where id = any(${optionIds}::uuid[])`
    : [];

  const lines: QuoteLine[] = items.map((item) => {
    const p = products.find((x) => x.id === item.product_id);
    const key = `${item.product_id}:${item.option_id ?? ""}`;
    if (!p || !p.is_visible) {
      return {
        key,
        product_id: item.product_id,
        option_id: item.option_id ?? null,
        slug: null,
        name: p?.name_en ?? "منتج غير متوفر",
        option_name: null,
        image_url: null,
        unit_price_iqd: null,
        quantity: item.quantity,
        available: false,
        reason: "unavailable",
      };
    }
    let unit = p.price_iqd;
    let optionName: string | null = null;
    let reason: QuoteLine["reason"];
    if (item.option_id) {
      const o = options.find((x) => x.id === item.option_id && x.product_id === p.id);
      if (!o || !o.is_available) reason = "option_unavailable";
      else {
        unit += o.price_delta_iqd;
        optionName = o.name;
      }
    }
    if (p.is_sold_out) reason = "sold_out";
    return {
      key,
      product_id: p.id,
      option_id: item.option_id ?? null,
      slug: p.slug,
      name: p.name_en,
      option_name: optionName,
      image_url: p.image_url,
      unit_price_iqd: unit,
      quantity: item.quantity,
      available: !reason,
      reason,
    };
  });

  const subtotal = lines.reduce((sum, l) => (l.available && l.unit_price_iqd !== null ? sum + l.unit_price_iqd * l.quantity : sum), 0);
  return {
    is_open: open,
    closed_message: settings.closed_message,
    delivery_note: settings.delivery_note,
    lines,
    subtotal_iqd: subtotal,
  };
}
