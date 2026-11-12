"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Keeps order lists fresh while the tab is visible. */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    const onVis = () => document.visibilityState === "visible" && router.refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [router, seconds]);
  return null;
}
