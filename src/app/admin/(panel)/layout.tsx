import Link from "next/link";
import { Logo } from "@/components/store/Logo";
import { AdminNav } from "@/components/admin/AdminNav";
import { AcceptingToggle } from "@/components/admin/AcceptingToggle";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { signOut } from "../actions";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const db = sql();
  const [{ n, accepting, open }] = await db<{ n: number; accepting: boolean; open: boolean }[]>`
    select (select count(*)::int from public.orders where status = 'new') as n,
           (select accepting_orders from public.store_settings where id = 1) as accepting,
           public.store_is_open() as open`;
  return (
    <div className="mx-auto max-w-[90rem] md:grid md:grid-cols-[15rem_1fr] md:gap-8 md:px-6">
      <aside className="sticky top-0 z-30 border-b hairline bg-ivory/95 px-4 pt-3 pb-2 backdrop-blur md:h-dvh md:border-0 md:bg-transparent md:px-0 md:py-8">
        <div className="flex items-center justify-between md:block">
          <Link href="/admin" aria-label="لوحة التحكم"><Logo className="h-auto w-[84px] md:w-[104px]" /></Link>
          <form action={signOut} className="md:hidden"><button className="text-sm text-muted hover:text-danger">خروج</button></form>
        </div>
        <div className="mt-3 md:mt-10"><AdminNav newCount={n} /></div>
        <div className="mt-8 hidden md:block"><AcceptingToggle value={accepting} isOpen={open} /></div>
        <div className="mt-6 hidden text-xs text-muted md:block">
          <p className="truncate" dir="ltr">{admin.email}</p>
          <div className="mt-3 flex gap-4">
            <Link href="/" target="_blank" className="hover:text-forest">عرض المتجر ↗</Link>
            <form action={signOut}><button className="hover:text-danger">تسجيل خروج</button></form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 md:px-0 md:py-8">
        <div className="mb-6 md:hidden"><AcceptingToggle value={accepting} isOpen={open} /></div>
        {children}
      </main>
    </div>
  );
}
