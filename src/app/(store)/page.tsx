import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/store/Hero";
import { ProductCard } from "@/components/store/ProductCard";
import { Reveal, Stagger, StaggerItem } from "@/components/store/Reveal";
import { AddToCartButton } from "@/components/store/AddToCartButton";
import { ArrowIcon } from "@/components/ui/Icons";
import { getVisibleProducts } from "@/lib/catalog";
import { formatIQD } from "@/lib/format";

export const revalidate = 60;

const PILLARS = [
  { n: "01", title: "لحظة، مو بس حلوى", body: "كوكاية فكرتها بسيطة: توقف شوي، وتستمتع بقطعة حلوة على راحتك." },
  { n: "02", title: "هادئة وراقية", body: "نكهات واضحة، وتغليف مرتب، وتفاصيل قليلة بس مقصودة." },
  { n: "03", title: "طلب بدون تعقيد", body: "تختار، تأكد طلبك، وإحنا نتواصل وياك حتى نرتب التوصيل." },
];

export default async function HomePage() {
  const products = await getVisibleProducts();
  const flagged = products.filter((p) => p.is_featured);
  const featured = (flagged.length ? flagged : products).slice(0, 3);
  const sharing = products.find((p) => p.category_slug === "sharing" && p.image_url) ?? null;

  return (
    <>
      <Hero />

      {/* Featured */}
      <section id="featured" className="scroll-mt-20 py-20 md:py-32" aria-labelledby="featured-title">
        <div className="container-k">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">مختارات كوكاية</p>
              <h2 id="featured-title" className="mt-4 text-3xl md:text-[2.75rem]">نكهات تبدي بيها</h2>
            </div>
            <Link href="/menu" className="group inline-flex items-center gap-2 text-[0.9375rem] font-bold text-forest">
              <span className="link-underline">كل المنيو</span>
              <ArrowIcon size={18} className="transition-transform duration-300 group-hover:-translate-x-1" />
            </Link>
          </Reveal>
          {featured.length > 0 ? (
            <Stagger className="-mx-5 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none] md:mx-0 md:mt-16 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
              {featured.map((p) => (
                <StaggerItem key={p.id} className="w-[68vw] max-w-[19rem] shrink-0 snap-start md:w-auto md:max-w-none">
                  <ProductCard product={p} sizes="(min-width: 768px) 30vw, 68vw" />
                </StaggerItem>
              ))}
            </Stagger>
          ) : (
            <p className="mt-12 text-muted">المنيو قيد التحديث.</p>
          )}
        </div>
      </section>

      {/* Why KOKAYE */}
      <section className="py-20 md:py-28" aria-labelledby="why-title">
        <div className="container-k grid gap-12 border-t hairline pt-16 md:grid-cols-12 md:pt-24">
          <Reveal className="md:col-span-4">
            <p className="eyebrow">ليش كوكاية</p>
            <h2 id="why-title" className="latin mt-4 text-[2.1rem] italic leading-tight text-forest md:text-[2.75rem]" dir="ltr" style={{ textAlign: "right" }}>
              More Than a Treat
            </h2>
          </Reveal>
          <ol className="grid gap-10 sm:grid-cols-3 md:col-span-8 md:gap-10">
            {PILLARS.map((p, i) => (
              <Reveal as="li" key={p.n} delay={i * 0.1} className="border-t border-champagne/70 pt-6">
                <span className="latin text-lg italic text-champagne">{p.n}</span>
                <h3 className="mt-3 text-xl">{p.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{p.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Sharing moment */}
      {sharing && (
        <section className="py-20 md:py-28" aria-labelledby="share-title">
          <div className="container-k grid items-center gap-10 md:grid-cols-12 md:gap-16">
            <Reveal className="md:col-span-7 md:order-2" y={30}>
              <Link href={`/menu/${sharing.slug}`} className="group block" tabIndex={-1} aria-hidden="true">
                <div className="media-frame aspect-[5/4]">
                  <Image
                    src={sharing.image_url!}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 55vw, 100vw"
                    className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-soft)] group-hover:scale-[1.03]"
                  />
                </div>
              </Link>
            </Reveal>
            <div className="md:col-span-5 md:order-1">
              <Reveal>
                <p className="eyebrow">لحظة مشاركة</p>
                <h2 id="share-title" className="mt-5 text-4xl leading-tight md:text-[3.25rem]">الحلو يحلى من نتشاركه.</h2>
              </Reveal>
              <Reveal delay={0.12} className="mt-10 border-t hairline pt-8">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="latin text-[1.75rem] text-forest">{sharing.name_en}</h3>
                  <p className="price text-lg text-cocoa">{formatIQD(sharing.price_iqd)}</p>
                </div>
                {sharing.short_description && <p className="mt-1 text-sm text-muted">{sharing.short_description}</p>}
                <div className="mt-7 flex items-center gap-3">
                  <div className="flex-1"><AddToCartButton product={sharing} variant="full" /></div>
                  <Link href={`/menu/${sharing.slug}`} className="btn btn-ghost">التفاصيل</Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <section className="pb-28 pt-8 text-center md:pb-36">
        <Reveal className="container-k">
          <p className="latin text-lg italic text-champagne" dir="ltr">Baked With Love. Shared With Joy.</p>
          <h2 className="mx-auto mt-4 max-w-xl text-3xl md:text-[2.75rem]">جاهز للحظتك الحلوة؟</h2>
          <Link href="/menu" className="btn btn-primary mt-9 px-10">اطلب هسه</Link>
        </Reveal>
      </section>
    </>
  );
}
