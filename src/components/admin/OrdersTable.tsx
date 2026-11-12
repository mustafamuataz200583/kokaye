import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { formatDateTime, formatIQD } from "@/lib/format";
import type { OrderRow } from "@/lib/types";

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  if (!orders.length) return <p className="rounded-2xl border border-dashed border-cocoa/15 p-10 text-center text-sm text-muted">ماكو طلبات.</p>;
  return (
    <>
      {/* mobile cards */}
      <ul className="grid gap-2 md:hidden">
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/admin/orders/${o.id}`} className="block rounded-2xl border hairline bg-paper p-4 active:bg-sand/60">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium tabular-nums text-forest" dir="ltr">{o.order_number}</span>
                <StatusBadge status={o.status} />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="truncate">{o.customer_name} · <span className="text-muted">{o.area}</span></span>
                <span className="price">{formatIQD(o.subtotal_iqd)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">{formatDateTime(o.created_at)} · {o.item_count} قطعة</p>
            </Link>
          </li>
        ))}
      </ul>
      {/* desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border hairline bg-paper md:block">
        <table className="w-full text-sm">
          <thead className="bg-sand/50 text-right text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">رقم الطلب</th>
              <th className="px-4 py-3 font-medium">الزبون</th>
              <th className="px-4 py-3 font-medium">المنطقة</th>
              <th className="px-4 py-3 font-medium">القطع</th>
              <th className="px-4 py-3 font-medium">المنتجات</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">التاريخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cocoa/6">
            {orders.map((o) => (
              <tr key={o.id} className="transition-colors hover:bg-sand/30">
                <td className="px-4 py-3"><Link href={`/admin/orders/${o.id}`} className="font-medium tabular-nums text-forest hover:underline" dir="ltr">{o.order_number}</Link></td>
                <td className="px-4 py-3"><div>{o.customer_name}</div><div className="text-xs tabular-nums text-muted" dir="ltr">{o.phone}</div></td>
                <td className="px-4 py-3 text-muted">{o.governorate} · {o.area}</td>
                <td className="px-4 py-3 tabular-nums">{o.item_count}</td>
                <td className="px-4 py-3 price">{formatIQD(o.subtotal_iqd)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-xs text-muted">{formatDateTime(o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
