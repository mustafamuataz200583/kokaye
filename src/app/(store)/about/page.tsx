import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/store/Reveal";
import cut from "../../../../public/images/products/dark-chocolate-cut-v3.webp";

export const metadata: Metadata = { title: "من نحن", description: "كوكاية — براند كوكيز من بغداد. مو بس كوكيز، لحظة حلوة." };

export default function AboutPage() {
  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-k grid items-center gap-12 md:grid-cols-12">
        <Reveal className="md:col-span-6">
          <p className="eyebrow">من نحن</p>
          <h1 className="mt-5 text-4xl leading-tight md:text-[3.4rem]">مو بس كوكيز.<br /><span className="text-forest-soft">لحظة حلوة.</span></h1>
          <div className="mt-8 grid max-w-lg gap-5 text-[1.0625rem] leading-loose text-cocoa/85">
            <p>كوكاية براند كوكيز من بغداد. الفكرة بسيطة: نقدم قطعة حلوة تخليك توقف شوي، وتستمتع بلحظتك على راحتك.</p>
            <p>نحب التفاصيل الهادئة: نكهات واضحة، تغليف مرتب، وتجربة طلب سهلة من أول ضغطة لحد ما يوصلك الطلب.</p>
            <p>وإذا تشاركها ويا ناسك، تصير أحلى.</p>
          </div>
          <Link href="/menu" className="btn btn-primary mt-10">شوف المنيو</Link>
        </Reveal>
        <Reveal className="md:col-span-5 md:col-start-8" y={30}>
          <div className="media-frame aspect-[4/5]">
            <Image src={cut} alt="كوكي الشوكولاتة الداكنة مقطوعة من كوكاية" fill placeholder="blur" sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
          </div>
          <p className="latin mt-4 text-left text-lg italic text-forest/60" dir="ltr">Baked With Love. Shared With Joy.</p>
        </Reveal>
      </div>
    </div>
  );
}
