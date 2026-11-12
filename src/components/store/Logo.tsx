import Image from "next/image";
import green from "../../../public/brand/logo-green.png";
import ivory from "../../../public/brand/logo-ivory.png";

/** The original KOKAYE | كوكاية lockup — never re-typeset. */
export function Logo({ tone = "green", className, priority }: { tone?: "green" | "ivory"; className?: string; priority?: boolean }) {
  return (
    <Image
      src={tone === "green" ? green : ivory}
      alt="KOKAYE | كوكاية"
      className={className}
      priority={priority}
      sizes="160px"
    />
  );
}
