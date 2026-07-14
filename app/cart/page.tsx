"use client";

import { useCart } from "@/components/CartProvider";
import { tugrug } from "@/lib/format";
import Link from "next/link";

export default function CartPage() {
  const { items, setQty, remove, total } = useCart();

  if (items.length === 0)
    return (
      <div className="py-24 text-center">
        <div className="mb-4 text-6xl">👟</div>
        <p className="mb-6 text-zinc-500">Таны сагс хоосон байна</p>
        <Link
          href="/"
          className="rounded-xl bg-lime-400 px-8 py-3 font-bold uppercase tracking-wide text-zinc-950 transition hover:bg-lime-300"
        >
          Пүүз үзэх
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display mb-6 text-2xl font-extrabold uppercase">Миний сагс</h1>
      <div className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-900">
        {items.map((i) => (
          <div key={i.key} className="flex flex-wrap items-center gap-3 p-4 sm:gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={i.image} alt={i.name} className="h-16 w-16 rounded-xl bg-zinc-800 object-cover" />
            <div className="min-w-[140px] flex-1">
              <Link href={`/products/${i.id}`} className="font-semibold transition hover:text-lime-400">
                {i.name}
              </Link>
              <div className="mt-0.5 flex flex-wrap gap-1.5 text-xs">
                {i.size && (
                  <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-zinc-300">
                    Размер {i.size}
                  </span>
                )}
                {i.color && (
                  <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-zinc-300">
                    {i.color}
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm text-zinc-500">{tugrug(i.price)}</div>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-zinc-700 bg-zinc-950">
                <button
                  className="px-3 py-1.5 text-zinc-300 hover:text-lime-400"
                  onClick={() => setQty(i.key, i.qty - 1)}
                >
                  −
                </button>
                <span className="min-w-8 text-center text-sm font-bold">{i.qty}</span>
                <button
                  className="px-3 py-1.5 text-zinc-300 hover:text-lime-400"
                  onClick={() => setQty(i.key, i.qty + 1)}
                >
                  +
                </button>
              </div>
              <div className="w-20 text-right font-semibold sm:w-24">{tugrug(i.price * i.qty)}</div>
              <button
                onClick={() => remove(i.key)}
                className="text-zinc-600 transition hover:text-red-400"
                title="Устгах"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="text-zinc-300">
          Нийт дүн:{" "}
          <span className="font-display ml-1 text-2xl font-bold text-lime-400">{tugrug(total)}</span>
        </div>
        <Link
          href="/checkout"
          className="w-full rounded-xl bg-lime-400 px-8 py-3 text-center font-bold uppercase tracking-wide text-zinc-950 transition hover:bg-lime-300 hover:shadow-[0_0_24px_rgba(163,230,53,0.35)] sm:w-auto"
        >
          Захиалах →
        </Link>
      </div>
    </div>
  );
}
