import Link from "next/link";
import { listOrders } from "@/lib/admin-data";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { cn } from "@/lib/format";

export const metadata = { title: "الطلبات" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const status = sp.status === "active" || ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus | "active") : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.slice(0, 60);
  const { rows, total, limit } = await listOrders({ status, q, page });
  const pages = Math.max(1, Math.ceil(total / limit));
  const tabs: { key?: string; label: string }[] = [{ label: "الكل" }, { key: "active", label: "الحالية" }, ...ORDER_STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s] }))];
  const qs = (o: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    Object.entries({ status, q, ...o }).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return s ? `?${s}` : "";
  };
  return (
    <div>
      <AutoRefresh />
      <h1 className="text-3xl">الطلبات</h1>
      <form className="mt-5 flex gap-2" action="/admin/orders">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} placeholder="ابحث برقم الطلب أو الهاتف أو الاسم" className="field max-w-md" aria-label="بحث" />
        <button className="btn btn-primary btn-sm">بحث</button>
      </form>
      <div className="mt-4 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
        {tabs.map((t) => (
          <Link key={t.label} href={`/admin/orders${qs({ status: t.key, page: undefined })}`} className={cn("shrink-0 rounded-full px-4 py-2 text-sm", status === t.key ? "bg-forest text-ivory" : "bg-paper text-cocoa/75 hover:text-forest")}>
            {t.label}
          </Link>
        ))}
      </div>
      <p className="mt-4 mb-3 text-xs text-muted">{total} طلب</p>
      <OrdersTable orders={rows} />
      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-2 text-sm" aria-label="الصفحات">
          {page > 1 && <Link className="btn btn-ghost btn-sm" href={`/admin/orders${qs({ page: String(page - 1) })}`}>السابق</Link>}
          <span className="px-3 tabular-nums text-muted">{page} / {pages}</span>
          {page < pages && <Link className="btn btn-ghost btn-sm" href={`/admin/orders${qs({ page: String(page + 1) })}`}>التالي</Link>}
        </nav>
      )}
    </div>
  );
}
