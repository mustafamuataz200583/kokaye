import Image from "next/image";
import { cn } from "@/lib/format";

type Props = {
  src: string | null;
  alt: string;
  name: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  soldOut?: boolean;
  zoomOnHover?: boolean;
  /** Show the whole photo (backdrop matches the frame, so letterboxing is invisible). */
  contain?: boolean;
};

/**
 * Product photo, or a clearly-labelled placeholder when no real photo exists yet.
 * The placeholder never pretends to be the product.
 */
export function ProductImage({ src, alt, name, sizes, priority, className, soldOut, zoomOnHover, contain }: Props) {
  return (
    <div className={cn("media-frame aspect-[4/5]", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={75}
          className={cn(
            contain ? "object-contain" : "object-cover",
            "transition-[transform,filter] duration-[900ms] ease-[var(--ease-soft)]",
            zoomOnHover && "group-hover:scale-[1.035]",
            soldOut && "grayscale-[55%] opacity-80",
          )}
        />
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-studio text-forest"
          role="img"
          aria-label={`${name} — صورة المنتج غير متوفرة بعد`}
        >
          <svg viewBox="0 0 120 120" className="w-[38%] max-w-32 opacity-[0.22]" aria-hidden="true">
            <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="46" cy="48" r="5" fill="currentColor" />
            <circle cx="70" cy="44" r="4" fill="currentColor" />
            <circle cx="74" cy="70" r="5.5" fill="currentColor" />
            <circle cx="50" cy="74" r="4" fill="currentColor" />
            <circle cx="60" cy="60" r="2.5" fill="currentColor" />
          </svg>
          <span className="latin px-3 text-center text-lg leading-tight text-forest/50">{name}</span>
          <span className="absolute top-3 left-3 rounded-full border border-champagne/50 bg-ivory/70 px-2.5 py-0.5 text-[0.6875rem] font-medium text-muted">
            صورة مؤقتة
          </span>
        </div>
      )}
    </div>
  );
}
