"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import hero from "../../../public/images/brand/assortment-v3.webp";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "9%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-6%"]);

  const line = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { y: "105%" },
    animate: reduce ? { opacity: 1 } : { y: "0%" },
    transition: { duration: 1, ease: EASE, delay },
  });

  return (
    <section ref={ref} className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="container-k grid items-center gap-12 md:grid-cols-12 md:gap-8">
        <motion.div style={{ y: textY }} className="md:col-span-6 lg:col-span-6">
          <motion.p
            className="eyebrow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <span className="latin text-[0.95rem] tracking-[0.18em] text-forest/70">KOKAYE</span>
            <span>بغداد</span>
          </motion.p>
          <h1 className="mt-6 text-[2.75rem] leading-[1.15] font-bold tracking-tight sm:text-6xl lg:text-[4.6rem]">
            <span className="block overflow-hidden pb-[0.08em]">
              <motion.span className="block" {...line(0.15)}>لحظتك الحلوة</motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.08em]">
              <motion.span className="block text-forest-soft" {...line(0.27)}>تبدي من هنا.</motion.span>
            </span>
          </h1>
          <motion.p
            className="mt-6 max-w-md text-lg leading-relaxed text-cocoa/80 md:text-xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.5 }}
          >
            كوكيز بطعم يخليك توقف شوي وتستمتع بكل لقمة.
          </motion.p>
          <motion.div
            className="mt-9 flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.75 }}
          >
            <Link href="/menu" className="btn btn-primary px-8">اطلب هسه</Link>
            <Link href="#featured" className="btn btn-ghost">اكتشف المنيو</Link>
          </motion.div>
        </motion.div>

        <div className="md:col-span-6 lg:col-span-5 lg:col-start-8">
          <motion.div
            className="media-frame aspect-[4/5]"
            initial={reduce ? { opacity: 0 } : { opacity: 0, clipPath: "inset(12% 12% 12% 12% round 24px)" }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, clipPath: "inset(0% 0% 0% 0% round 24px)" }}
            transition={{ duration: 1.3, ease: EASE, delay: 0.2 }}
          >
            <motion.div className="absolute inset-[-6%]" style={{ y: imgY }}>
              <motion.div
                className="relative h-full w-full"
                initial={reduce ? false : { scale: 1.12 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.8, ease: EASE, delay: 0.2 }}
              >
                <Image
                  src={hero}
                  alt="صينية كوكيز وكوكيتين من كوكاية"
                  fill
                  priority
                  placeholder="blur"
                  sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </motion.div>
            </motion.div>
          </motion.div>
          <motion.p
            className="latin mt-4 text-left text-[1.05rem] italic text-forest/60"
            dir="ltr"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
          >
            A Little Joy in Every Bite
          </motion.p>
        </div>
      </div>
    </section>
  );
}
