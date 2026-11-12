"use client";

import { useFormAction } from "./useFormAction";

import { signIn, type ActionState } from "@/app/admin/actions";
import { SpinnerIcon } from "@/components/ui/Icons";

export function LoginForm() {
  const [state, onSubmit, pending] = useFormAction(signIn);
  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div>
        <label htmlFor="email" className="field-label">البريد الإلكتروني</label>
        <input id="email" name="email" type="email" autoComplete="username" dir="ltr" className="field text-right" required />
      </div>
      <div>
        <label htmlFor="password" className="field-label">كلمة المرور</label>
        <input id="password" name="password" type="password" autoComplete="current-password" dir="ltr" className="field text-right" required />
      </div>
      {state.error && <p role="alert" className="rounded-xl bg-danger/5 px-4 py-3 text-sm text-danger">{state.error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? <><SpinnerIcon /> جاري الدخول…</> : "دخول"}</button>
    </form>
  );
}
