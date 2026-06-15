"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { Product } from "@/lib/db";

export default function AddToCart({ p }: { p: Product }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (p.stock <= 0)
    return <div className="text-red-500 font-medium">Барааны үлдэгдэл дууссан байна</div>;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center border border-slate-300 rounded-lg">
        <button
          className="px-3 py-2 hover:bg-slate-100"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
        >
          −
        </button>
        <span className="px-3 min-w-10 text-center">{qty}</span>
        <button
          className="px-3 py-2 hover:bg-slate-100"
          onClick={() => setQty((q) => Math.min(p.stock, q + 1))}
        >
          +
        </button>
      </div>
      <button
        onClick={() => {
          add({ id: p.id, name: p.name, price: p.price, image: p.image, stock: p.stock }, qty);
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
        className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700"
      >
        {added ? "✓ Нэмэгдлээ" : "🛒 Сагсанд нэмэх"}
      </button>
    </div>
  );
}
