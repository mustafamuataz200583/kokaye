"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { MAX_LINES, MAX_QTY_PER_LINE } from "@/lib/constants";
import type { Quote } from "@/lib/types";

export type CartItem = {
  key: string; // `${product_id}:${option_id ?? ""}`
  product_id: string;
  option_id: string | null;
  slug: string;
  name: string;
  option_name: string | null;
  image_url: string | null;
  unit_price_iqd: number; // display only — the server re-prices every order
  quantity: number;
  unavailable?: boolean;
};

type Toast = { id: number; message: string; tone: "success" | "info" | "error" };

type CartCtx = {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "key" | "quantity">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  bump: number;
  toasts: Toast[];
  toast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
  quote: Quote | null;
  quoteState: "idle" | "loading" | "error";
  refreshQuote: () => Promise<Quote | null>;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "kokaye-cart-v1";

function readStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i && typeof i.product_id === "string" && Number.isInteger(i.quantity) && i.quantity > 0)
      .slice(0, MAX_LINES)
      .map((i) => ({ ...i, quantity: Math.min(i.quantity, MAX_QTY_PER_LINE) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bump, setBump] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteState, setQuoteState] = useState<"idle" | "loading" | "error">("idle");
  const toastId = useRef(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    setItems(readStorage());
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable (private mode) — cart still works in memory */
    }
  }, [items, hydrated]);

  const toast = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const add = useCallback<CartCtx["add"]>(
    (item, qty = 1) => {
      const key = `${item.product_id}:${item.option_id ?? ""}`;
      const snapshot = itemsRef.current;
      const existing = snapshot.find((i) => i.key === key);
      const limited = existing
        ? existing.quantity >= MAX_QTY_PER_LINE
        : snapshot.length >= MAX_LINES;
      if (limited) {
        toast(existing ? "وصلت للحد الأعلى لهذا المنتج" : "السلة وصلت للحد الأعلى من المنتجات", "info");
        return;
      }
      setItems((prev) => {
        const found = prev.find((i) => i.key === key);
        if (found) {
          const nextQty = Math.min(found.quantity + qty, MAX_QTY_PER_LINE);
          return prev.map((i) => (i.key === key ? { ...i, ...item, key, quantity: nextQty, unavailable: false } : i));
        }
        return [...prev, { ...item, key, quantity: Math.min(qty, MAX_QTY_PER_LINE) }];
      });
      setBump((b) => b + 1);
      toast(`انضافت ${item.name} للسلة`);
    },
    [toast],
  );

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(qty, MAX_QTY_PER_LINE) } : i)),
    );
    setBump((b) => b + 1);
  }, []);

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const refreshQuote = useCallback(async (): Promise<Quote | null> => {
    const current = itemsRef.current;
    setQuoteState("loading");
    try {
      const res = await fetch("/api/cart/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: current.map((i) => ({ product_id: i.product_id, option_id: i.option_id, quantity: i.quantity })),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const q = (await res.json()) as Quote;
      setQuote(q);
      setQuoteState("idle");
      // Reconcile displayed prices/availability with the server truth.
      setItems((prev) =>
        prev.map((i) => {
          const line = q.lines.find((l) => l.key === i.key);
          if (!line) return i;
          return {
            ...i,
            name: line.name,
            option_name: line.option_name ?? i.option_name,
            image_url: line.image_url ?? i.image_url,
            unit_price_iqd: line.unit_price_iqd ?? i.unit_price_iqd,
            unavailable: !line.available,
          };
        }),
      );
      return q;
    } catch {
      setQuoteState("error");
      return null;
    }
  }, []);

  const value = useMemo<CartCtx>(() => {
    const available = items.filter((i) => !i.unavailable);
    return {
      items,
      hydrated,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: available.reduce((n, i) => n + i.unit_price_iqd * i.quantity, 0),
      add,
      setQty,
      remove,
      clear,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      bump,
      toasts,
      toast,
      dismissToast,
      quote,
      quoteState,
      refreshQuote,
    };
  }, [items, hydrated, add, setQty, remove, clear, drawerOpen, bump, toasts, toast, dismissToast, quote, quoteState, refreshQuote]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
