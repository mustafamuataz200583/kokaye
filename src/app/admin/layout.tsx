import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "لوحة التحكم", template: "%s — لوحة تحكم كوكاية" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-ivory">{children}</div>;
}
