import Link from "next/link";
import type { Product } from "@/lib/types";
import { cn, formatIQD } from "@/lib/format";
import { ProductImage } from "./ProductImage";
import { AddToCartButton } from "./AddToCartButton";

type Props = { product: Product; priority?: boolean; sizes?: string; imageClassName?: string; contain?: boolean };

export function ProductCard({ product, priority = false, sizes, imageClassName, contain }: Props) {
  const hasOptions = product.options.some((o) => o.is_available);
  const action = hasOptions ? (
    <Link
      href={`/menu/${product.slug}`}
      className="grid h-11 w-11 place-items-center rounded-full border border-forest/25 bg-ivory/90 text-[0.7rem] font-medium text-forest transition-colors hover:border-forest"
      aria-label={`اختار خيارات ${product.name_en}`}
    >
      اختار
    </Link>
  ) : (
    <AddToCartButton product={product} />
  );

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative">
        <Link href={`/menu/${product.slug}`} className="block rounded-[var(--radius-media)]" aria-label={`${product.name_en} — التفاصيل`}>
          <ProductImage
            src={product.image_url}
            alt={product.image_alt ?? product.name_en}
            name={product.name_en}
            priority={priority}
            soldOut={product.is_sold_out}
            zoomOnHover
            contain={contain}
            className={cn("transition-shadow duration-700 ease-[var(--ease-soft)] group-hover:shadow-[var(--shadow-soft)]", imageClassName)}
            sizes={sizes ?? "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 50vw"}
          />
        </Link>
        {product.is_sold_out && (
          <span className="absolute top-3 right-3 rounded-full bg-ivory/95 px-3 py-1 text-xs font-medium text-cocoa backdrop-blur">
            نفدت الكمية
          </span>
        )}
        <div className="absolute bottom-3 left-3 sm:hidden">{action}</div>
      </div>

      <div className="flex flex-1 flex-col pt-4 sm:pt-5">
        <h3 className="latin text-[1.15rem] leading-[1.15] text-forest sm:text-[1.5rem]">
          <Link href={`/menu/${product.slug}`} className="link-underline">{product.name_en}</Link>
        </h3>
        {product.name_ar && <p className="mt-1 text-sm font-medium text-cocoa/80">{product.name_ar}</p>}
        {product.short_description && (
          <p className="mt-1.5 line-clamp-1 text-[0.8125rem] text-muted sm:text-sm">{product.short_description}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <p className="price text-[0.9375rem] text-cocoa sm:text-base">{formatIQD(product.price_iqd)}</p>
          <div className="hidden sm:block">{action}</div>
        </div>
      </div>
    </article>
  );
}
