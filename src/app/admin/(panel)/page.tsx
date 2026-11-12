import Link from "next/link";
import { getDashboard } from "@/lib/admin-data";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { formatIQD, formatNumber } from "@/lib/format";

export const metadata = { title: "الرئيسية" };

export default async function Dashboard() {
  const { counts, sales, top, recent } = await getDashboard();
  const cards = [
    { label: "طلبات جديدة", value: counts.new, href: "/admin/orders?status=new", accent: true },
    { label: "قيد التحضير", value: counts.preparing + counts.confirmed, sub: `${counts.confirmed} مؤكد · ${counts.preparing} تحضير`, href: "/admin/orders?status=active" },
    { label: "مكتملة", value: counts.delivered, href: "/admin/orders?status=delivered" },
    { label: "ملغية", value: counts.cancelled, href: "/admin/orders?status=cancelled" },
  ];
  const maxQty = Math.max(1, ...top.map((t) => t.qty));
  return (
    <div>
      <AutoRefresh />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl">أهلاً</h1>
          <p className="mt-1 text-sm text-muted">اليوم وصلت {formatNumber(counts.today)} طلبات · المجموع الكلي {formatNumber(counts.total)}</p>
        </div>
        <Link href="/admin/orders" className="btn btn-ghost btn-sm">كل الطلبات</Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className={`rounded-2xl border p-5 transition-shadow hover:shadow-[var(--shadow-soft)] ${c.accent ? "border-forest bg-forest text-ivory" : "hairline bg-paper"}`}>
            <p className={`text-sm ${c.accent ? "text-ivory/75" : "text-muted"}`}>{c.label}</p>
            <p className="mt-2 text-3xl font-medium tabular-nums">{formatNumber(c.value)}</p>
            {c.sub && <p className="mt-1 text-xs text-muted">{c.sub}</p>}
          </Link>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border hairline bg-paper p-5 lg:col-span-1">
          <p className="text-sm text-muted">مبيعات الطلبات المكتملة</p>
          <p className="price mt-2 text-3xl text-forest">{formatIQD(sales.products)}</p>
          <p className="mt-2 text-xs text-muted">مجموع المنتجات فقط. أجور التوصيل المسجلة: <span className="price">{formatIQD(sales.delivery)}</span></p>
        </div>
        <div className="rounded-2xl border hairline bg-paper p-5 lg:col-span-2">
          <p className="text-sm text-muted">المنتجات الأكثر طلباً <span className="text-xs">(بدون الملغية)</span></p>
          {top.length === 0 ? (
            <p className="mt-6 text-sm text-muted">لسه ماكو طلبات.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {top.map((t) => (
                <li key={t.name} className="grid grid-cols-[8rem_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[11rem_1fr_auto]">
                  <span className="latin truncate text-base text-forest">{t.name}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-sand"><span className="block h-full rounded-full bg-forest/70" style={{ width: `${(t.qty / maxQty) * 100}%` }} /></span>
                  <span className="tabular-nums text-muted">{formatNumber(t.qty)} قطعة</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h2 className="mt-10 mb-4 text-xl">آخر الطلبات</h2>
      <OrdersTable orders={recent} />
    </div>
  );
}
