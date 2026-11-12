import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/store/ProductGallery";
import { ProductPurchase } from "@/components/store/ProductPurchase";
import { ProductCard } from "@/components/store/ProductCard";
import { Reveal } from "@/components/store/Reveal";
import { getProductBySlug, getVisibleProducts } from "@/lib/catalog";
import { formatIQD } from "@/lib/format";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await getVisibleProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "المنتج غير موجود" };
  return {
    title: p.name_en,
    description: p.short_description ?? `${p.name_en} من كوكاية — ${formatIQD(p.price_iqd)}`,
    openGraph: p.image_url ? { images: [{ url: p.image_url }] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const all = await getVisibleProducts();
  const related = all.filter((p) => p.id !== product.id && p.category_slug === product.category_slug).concat(all.filter((p) => p.id !== product.id && p.category_slug !== product.category_slug)).slice(0, 3);

  const facts = [
    { label: "الحصة", value: product.serving_note },
    { label: "الوزن", value: product.weight_text },
    { label: "عدد القطع", value: product.pieces_text },
    { label: "الحشوة", value: product.filling_text },
  ].filter((f) => f.value);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name_en,
    description: product.short_description ?? undefined,
    image: product.image_url ?? undefined,
    brand: { "@type": "Brand", name: "KOKAYE" },
    offers: {
      "@type": "Offer",
      priceCurrency: "IQD",
      price: product.price_iqd,
      availability: product.is_sold_out ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <div className="pt-24 pb-24 md:pt-32">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container-k">
        <nav aria-label="مسار التصفح" className="mb-6 text-sm text-muted">
          <Link href="/menu" className="link-underline">المنيو</Link>
          <span className="mx-2 text-champagne">/</span>
          <span className="latin text-base text-cocoa">{product.name_en}</span>
        </nav>
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <Reveal className="md:col-span-6 lg:col-span-7" y={16}>
            <ProductGallery
              images={[product.image_url, ...(product.gallery_urls ?? [])].filter((x): x is string => Boolean(x))}
              alt={product.image_alt ?? product.name_en}
              name={product.name_en}
              soldOut={product.is_sold_out}
            />
          </Reveal>
          <div className="md:col-span-6 lg:col-span-5">
            <div className="md:sticky md:top-28">
              <Reveal>
                {product.is_sold_out && (
                  <span className="mb-4 inline-block rounded-full bg-cocoa/8 px-3 py-1 text-xs font-medium text-cocoa">نفدت الكمية حالياً</span>
                )}
                <h1 className="latin text-[2.6rem] leading-[1.05] text-forest md:text-[3.4rem]">{product.name_en}</h1>
                {product.name_ar && <p className="mt-2 text-lg font-medium text-cocoa/80">{product.name_ar}</p>}
                <p className="price mt-5 text-2xl text-cocoa">{formatIQD(product.price_iqd)}</p>
                {(product.description || product.short_description) && (
                  <p className="mt-6 max-w-md whitespace-pre-line text-[1.0625rem] leading-relaxed text-cocoa/80">
                    {product.description || product.short_description}
                  </p>
                )}
                {facts.length > 0 && (
                  <dl className="mt-6 grid grid-cols-2 gap-3">
                    {facts.map((f) => (
                      <div key={f.label} className="rounded-2xl bg-sand/70 px-4 py-3">
                        <dt className="text-xs text-muted">{f.label}</dt>
                        <dd className="mt-0.5 text-sm font-medium text-cocoa">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </Reveal>
              <Reveal delay={0.1}>
                <ProductPurchase product={product} />
              </Reveal>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-k mt-24 border-t hairline pt-16" aria-labelledby="more-title">
          <h2 id="more-title" className="text-2xl md:text-3xl">وتقدر تجرب هم</h2>
          <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-8">
            {related.map((p, i) => (
              <li key={p.id} className={i === 2 ? "hidden md:block" : undefined}><ProductCard product={p} /></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
