export const GOVERNORATES = [
  "بغداد",
  "البصرة",
  "نينوى",
  "أربيل",
  "النجف",
  "كربلاء",
  "بابل",
  "الأنبار",
  "ديالى",
  "صلاح الدين",
  "كركوك",
  "واسط",
  "ميسان",
  "ذي قار",
  "المثنى",
  "القادسية",
  "دهوك",
  "السليمانية",
  "حلبجة",
] as const;

export const ORDER_STATUSES = [
  "new",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "جديد",
  confirmed: "تم التأكيد",
  preparing: "قيد التحضير",
  out_for_delivery: "خرج للتوصيل",
  delivered: "مكتمل",
  cancelled: "ملغي",
};

export const STATUS_CUSTOMER_HINT: Record<OrderStatus, string> = {
  new: "طلبك وصلنا، وراح نتواصل وياك قريباً حتى نأكد التفاصيل.",
  confirmed: "تأكد طلبك. هسه نجهزه.",
  preparing: "طلبك قيد التحضير.",
  out_for_delivery: "طلبك بالطريق إلك.",
  delivered: "وصل طلبك. بالعافية!",
  cancelled: "هذا الطلب ملغي. إذا عندك سؤال تواصل ويانا.",
};

export const CUSTOMER_FLOW: OrderStatus[] = ["new", "confirmed", "preparing", "out_for_delivery", "delivered"];

export const MAX_QTY_PER_LINE = 50;
export const MAX_LINES = 30;

export const BRAND = {
  name: "KOKAYE",
  nameAr: "كوكاية",
  defaultPhone: "07807784994",
  defaultWhatsapp: "9647807784994",
};
