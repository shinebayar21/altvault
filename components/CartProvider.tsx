"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const MAX_QTY = 99;

export type CartItem = {
  key: string; // id|size|color — нэг бараа өөр размер/өнгөөр тусдаа мөр болно
  id: number;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  qty: number;
};

export function cartKey(id: number, size: string, color: string): string {
  return `${id}|${size}|${color}`;
}

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty" | "key">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  total: number;
  count: number;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart");
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CartItem>[];
        // хуучин форматын (size/color-гүй) сагсыг шинэ рүү хөрвүүлнэ
        setItems(
          parsed
            .filter((i) => i && typeof i.id === "number")
            .map((i) => ({
              id: i.id!,
              name: i.name || "",
              price: i.price || 0,
              image: i.image || "",
              size: i.size || "",
              color: i.color || "",
              qty: i.qty || 1,
              key: i.key || cartKey(i.id!, i.size || "", i.color || ""),
            }))
        );
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("cart", JSON.stringify(items));
  }, [items, loaded]);

  const add = (item: Omit<CartItem, "qty" | "key">, qty = 1) => {
    const key = cartKey(item.id, item.size, item.color);
    setItems((prev) => {
      const ex = prev.find((i) => i.key === key);
      if (ex) {
        return prev.map((i) => (i.key === key ? { ...i, qty: Math.min(i.qty + qty, MAX_QTY) } : i));
      }
      return [...prev, { ...item, key, qty: Math.min(qty, MAX_QTY) }];
    });
  };

  const setQty = (key: string, qty: number) =>
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(qty, MAX_QTY)) } : i))
    );

  const remove = (key: string) => setItems((prev) => prev.filter((i) => i.key !== key));
  const clear = () => setItems([]);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <Ctx.Provider value={{ items, add, setQty, remove, clear, total, count }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("CartProvider дотор ашиглана уу");
  return ctx;
}
