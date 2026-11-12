import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { OptionsEditor } from "@/components/admin/OptionsEditor";
import { getAdminProduct, listAllCategories } from "@/lib/admin-data";

export const metadata = { title: "تعديل منتج" };

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [data, categories] = await Promise.all([getAdminProduct(id), listAllCategories()]);
  if (!data) notFound();
  return (
    <div>
      <Link href="/admin/products" className="text-sm text-muted hover:text-forest">→ المنتجات</Link>
      <div className="mt-3 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="latin text-3xl">{data.product.name_en}</h1>
        {data.product.is_visible && <Link href={`/menu/${data.product.slug}`} target="_blank" className="text-sm text-muted hover:text-forest">عرض بالمتجر ↗</Link>}
      </div>
      <ProductForm key={data.product.id + data.product.price_iqd} product={data.product} categories={categories} created={Boolean(sp.created)} />
      <OptionsEditor productId={data.product.id} options={data.options} />
    </div>
  );
}
