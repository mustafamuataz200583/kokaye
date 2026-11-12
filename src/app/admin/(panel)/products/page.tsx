import Link from "next/link";
import { listAdminProducts } from "@/lib/admin-data";
import { ProductRow } from "@/components/admin/ProductRow";

export const metadata = { title: "المنتجات" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const sp = await searchParams;
  const products = await listAdminProducts();
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">المنتجات</h1>
          <p className="mt-1 text-sm text-muted">الترتيب هنا هو نفس ترتيب الظهور بالمتجر. "مميز" يظهر بالرئيسية.</p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary btn-sm">+ منتج جديد</Link>
      </div>
      {sp.deleted && <p className="mt-4 rounded-xl bg-forest/8 px-4 py-3 text-sm text-forest" role="status">تم حذف المنتج.</p>}
      <ul className="mt-6 grid gap-2">
        {products.map((p, i) => <ProductRow key={p.id} p={p} first={i === 0} last={i === products.length - 1} />)}
      </ul>
    </div>
  );
}
