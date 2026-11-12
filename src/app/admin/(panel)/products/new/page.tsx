import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { listAllCategories } from "@/lib/admin-data";

export const metadata = { title: "منتج جديد" };

export default async function NewProduct() {
  const categories = await listAllCategories();
  return (
    <div>
      <Link href="/admin/products" className="text-sm text-muted hover:text-forest">→ المنتجات</Link>
      <h1 className="mt-3 mb-6 text-3xl">منتج جديد</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
