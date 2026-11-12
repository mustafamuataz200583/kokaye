import type { OrderStatus } from "./constants";

export type ProductOption = {
  id: string;
  name: string;
  price_delta_iqd: number;
  is_available: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string | null;
  short_description: string | null;
  description: string | null;
  price_iqd: number;
  category_id: string | null;
  category_slug: string | null;
  image_url: string | null;
  image_alt: string | null;
  serving_note: string | null;
  weight_text: string | null;
  pieces_text: string | null;
  filling_text: string | null;
  is_sold_out: boolean;
  is_featured: boolean;
  gallery_urls: string[];
  options: ProductOption[];
};

export type Category = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string | null;
};

export type StoreSettings = {
  phone: string;
  whatsapp_international: string;
  location_text: string;
  contact_note: string | null;
  order_hours_text: string;
  accepting_orders: boolean;
  enforce_hours: boolean;
  open_time: string | null;
  close_time: string | null;
  closed_message: string;
  delivery_note: string;
  delivery_area_text: string;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  snapchat_url: string | null;
  privacy_text: string;
  terms_text: string;
  updated_at: string;
};

export type PublicSettings = Omit<StoreSettings, "privacy_text" | "terms_text"> & { is_open: boolean };

export type CartLineInput = { product_id: string; option_id?: string | null; quantity: number };

export type QuoteLine = {
  key: string;
  product_id: string;
  option_id: string | null;
  slug: string | null;
  name: string;
  option_name: string | null;
  image_url: string | null;
  unit_price_iqd: number | null;
  quantity: number;
  available: boolean;
  reason?: "unavailable" | "sold_out" | "option_unavailable";
};

export type Quote = {
  is_open: boolean;
  closed_message: string;
  delivery_note: string;
  lines: QuoteLine[];
  subtotal_iqd: number;
};

export type OrderRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer_name: string;
  phone: string;
  governorate: string;
  area: string;
  address: string;
  landmark: string | null;
  notes: string | null;
  subtotal_iqd: number;
  delivery_fee_iqd: number | null;
  admin_notes: string | null;
  created_at: string;
  status_changed_at: string;
  item_count?: number;
};

export type OrderItemRow = {
  id: string;
  product_id: string | null;
  product_name: string;
  option_name: string | null;
  unit_price_iqd: number;
  quantity: number;
  line_total_iqd: number;
};
