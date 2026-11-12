"use client";

import { useActionState, useTransition } from "react";
import type { ActionState } from "@/app/admin/actions";

/**
 * Like useActionState, but submits via onSubmit so React does NOT auto-reset
 * the form — typed values survive validation errors.
 */
export function useFormAction(action: (s: ActionState, f: FormData) => Promise<ActionState>, opts: { resetOnSuccess?: boolean } = {}) {
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(async (s, f) => {
    const r = await action(s, f);
    return r;
  }, {});
  const [, start] = useTransition();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    start(async () => {
      dispatch(fd);
    });
    if (opts.resetOnSuccess) {
      // cleared optimistically only for small add-forms
      window.setTimeout(() => form.querySelectorAll<HTMLInputElement>("input[data-reset]").forEach((i) => (i.value = i.defaultValue)), 0);
    }
  };
  return [state, onSubmit, pending] as const;
}
