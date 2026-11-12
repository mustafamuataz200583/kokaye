import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/admin-data";
import { OrderMetaForm, StatusControl } from "@/components/admin/OrderControls";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PhoneIcon, WhatsappIcon } from "@/components/ui/Icons";
import { STATUS_LABELS } from "@/lib/constants";
import { formatDateTime, formatIQD } from "@/lib/format";
import { toInternational } from "@/lib/phone";

export const metadata = { title: "تفاصيل الطلب" };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getOrder(id);
  if (!data) notFound();
  const { order: o, items, history } = data;
  const waText = encodeURIComponent(`هلا ${o.customer_name.split(" ")[0]}، وياك كوكاية بخصوص طلبك رقم ${o.order_number}.`);
  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-muted hover:text-forest">→ الطلبات</Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl tabular-nums" dir="ltr">{o.order_number}</h1>
        <StatusBadge status={o.status} />
      </div>
      <p className="mt-1 text-sm text-muted">{formatDateTime(o.created_at)}</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border hairline bg-paper p-5 lg:col-span-2">
          <h2 className="text-lg">المنتجات</h2>
          <ul className="mt-3 divide-y divide-cocoa/8">
            {items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="latin text-lg text-forest">{i.product_name}</p>
                  {i.option_name && <p className="text-xs text-muted">{i.option_name}</p>}
                  <p className="text-xs text-muted tabular-nums">{formatIQD(i.unit_price_iqd)} × {i.quantity}</p>
                </div>
                <span className="price">{formatIQD(i.line_total_iqd)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-2 grid gap-2 border-t hairline pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">مجموع المنتجات</dt><dd className="price">{formatIQD(o.subtotal_iqd)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">التوصيل</dt><dd className="price">{o.delivery_fee_iqd === null ? "لم يُحدد" : formatIQD(o.delivery_fee_iqd)}</dd></div>
            <div className="flex justify-between text-base font-medium"><dt>المجموع الكلي</dt><dd className="price text-forest">{o.delivery_fee_iqd === null ? "—" : formatIQD(o.subtotal_iqd + o.delivery_fee_iqd)}</dd></div>
          </dl>
        </section>

        <section className="rounded-2xl border hairline bg-paper p-5">
          <h2 className="text-lg">الزبون</h2>
          <p className="mt-3 font-medium">{o.customer_name}</p>
          <p className="mt-1 tabular-nums text-muted" dir="ltr" style={{ textAlign: "right" }}>{o.phone}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href={`tel:${o.phone}`} className="btn btn-ghost btn-sm"><PhoneIcon size={16} /> اتصال</a>
            <a href={`https://wa.me/${toInternational(o.phone)}?text=${waText}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm"><WhatsappIcon size={16} /> واتساب</a>
          </div>
          <h3 className="mt-6 text-sm font-medium text-muted">العنوان</h3>
          <p className="mt-1 text-sm leading-relaxed">{o.governorate} — {o.area}<br />{o.address}</p>
          {o.landmark && <p className="mt-1 text-sm text-muted">أقرب نقطة دالة: {o.landmark}</p>}
          {o.notes && (<><h3 className="mt-5 text-sm font-medium text-muted">ملاحظات الزبون</h3><p className="mt-1 whitespace-pre-line rounded-xl bg-sand/60 p-3 text-sm">{o.notes}</p></>)}
        </section>

        <section className="rounded-2xl border hairline bg-paper p-5 lg:col-span-2">
          <h2 className="mb-4 text-lg">حالة الطلب</h2>
          <StatusControl orderId={o.id} status={o.status} />
          <h3 className="mt-4 text-sm font-medium text-muted">السجل</h3>
          <ol className="mt-2 grid gap-1.5 text-xs text-muted">
            {history.map((h, i) => (
              <li key={i}>{formatDateTime(h.changed_at)} — <span className="text-cocoa">{STATUS_LABELS[h.status]}</span>{h.email ? ` · ${h.email}` : ""}</li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border hairline bg-paper p-5">
          <h2 className="mb-4 text-lg">التوصيل والملاحظات</h2>
          <OrderMetaForm orderId={o.id} deliveryFee={o.delivery_fee_iqd} adminNotes={o.admin_notes} subtotal={o.subtotal_iqd} />
        </section>
      </div>
    </div>
  );
}
