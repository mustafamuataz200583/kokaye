"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ProductImage } from "./ProductImage";
import { cn } from "@/lib/format";

type Props = { images: string[]; alt: string; name: string; soldOut: boolean };

/** Main photo + thumbnails, with a soft crossfade between images. */
export function ProductGallery({ images, alt, name, soldOut }: Props) {
  const [index, setIndex] = useState(0);
  if (images.length <= 1) {
    return (
      <ProductImage src={images[0] ?? null} alt={alt} name={name} priority soldOut={soldOut}
        sizes="(min-width: 1024px) 55vw, (min-width: 768px) 50vw, 100vw" className="md:aspect-[5/6]" />
    );
  }
  return (
    <div>
      <div className="media-frame aspect-[4/5] md:aspect-[5/6]">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={images[index]}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image src={images[index]} alt={index === 0 ? alt : `${alt} — صورة ${index + 1}`} fill priority={index === 0}
              sizes="(min-width: 1024px) 55vw, (min-width: 768px) 50vw, 100vw"
              className={cn("object-cover", soldOut && "grayscale-[55%] opacity-80")} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-3 flex gap-2" role="tablist" aria-label="صور المنتج">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`الصورة ${i + 1}`}
            onClick={() => setIndex(i)}
            className={cn(
              "relative aspect-[4/5] w-16 overflow-hidden rounded-xl transition-[opacity,box-shadow] duration-300 md:w-20",
              i === index ? "opacity-100 ring-2 ring-forest ring-offset-2 ring-offset-ivory" : "opacity-60 hover:opacity-100",
            )}
          >
            <Image src={src} alt="" fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
