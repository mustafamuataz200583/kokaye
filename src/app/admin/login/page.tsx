import { redirect } from "next/navigation";
import { Logo } from "@/components/store/Logo";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdmin } from "@/lib/auth";

export const metadata = { title: "تسجيل الدخول" };

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Logo className="mx-auto h-auto w-[120px]" priority />
        <div className="mt-10 rounded-[var(--radius-card)] border hairline bg-paper p-7 shadow-[var(--shadow-soft)]">
          <h1 className="text-2xl">لوحة التحكم</h1>
          <p className="mt-1 mb-6 text-sm text-muted">خاصة بإدارة كوكاية فقط.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
