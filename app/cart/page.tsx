"use client";

import { useCart } from "@/components/CartProvider";
import { tugrug } from "@/lib/format";
import Link from "next/link";

export default function CartPage() {
  const { items, setQty, remove, total } = useCart();

  if (items.length === 0)
    return (
      <div className="text-center py-24">
        <div className="text-5xl mb-4">🛒</div>
        <p className="text-slate-500 mb-6">Таны сагс хоосон байна</p>
        <Link href="/" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700">
          Бараа үзэх
        </Link>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-5">Миний сагс</h1>
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-4 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={i.image} alt={i.name} className="w-16 h-16 rounded-lg object-cover bg-slate-100" />
            <div className="flex-1">
              <Link href={`/products/${i.id}`} className="font-medium hover:text-indigo-600">
                {i.name}
              </Link>
              <div className="text-sm text-slate-500">{tugrug(i.price)}</div>
            </div>
            <div className="flex items-center border border-slate-300 rounded-lg">
              <button className="px-2.5 py-1 hover:bg-slate-100" onClick={() => setQty(i.id, i.qty - 1)}>
                −
              </button>
              <span className="px-2 min-w-8 text-center text-sm">{i.qty}</span>
              <button className="px-2.5 py-1 hover:bg-slate-100" onClick={() => setQty(i.id, i.qty + 1)}>
                +
              </button>
            </div>
            <div className="w-24 text-right font-medium">{tugrug(i.price * i.qty)}</div>
            <button onClick={() => remove(i.id)} className="text-slate-400 hover:text-red-500">
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
        <div>
          Нийт дүн: <span className="text-xl font-bold text-indigo-600">{tugrug(total)}</span>
        </div>
        <Link
          href="/checkout"
          className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700"
        >
          Захиалах →
        </Link>
      </div>
    </div>
  );
}
