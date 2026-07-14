"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export default function Header({ storeName, logo }: { storeName: string; logo?: string }) {
  const { count } = useCart();
  // Нэрний төгсгөлд өргөтгөл байвал өнгөөр ялгана, байхгүй бол нэрийг байгаагаар нь харуулна
  const ext = storeName.match(/\.\w+$/)?.[0] ?? "";
  const base = ext ? storeName.slice(0, -ext.length) : storeName;
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-display flex min-w-0 items-center gap-1.5 text-lg font-extrabold uppercase tracking-wide text-zinc-50 sm:gap-2 sm:text-xl"
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-8 w-8 shrink-0 rounded-lg object-contain sm:h-9 sm:w-9" />
          ) : (
            <span>👟</span>
          )}
          <span className="truncate">
            {base}
            {ext && <span className="text-lime-400">{ext}</span>}
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-0.5 text-sm sm:gap-2">
          <Link
            href="/"
            className="hidden rounded-lg px-3 py-2 font-medium text-zinc-300 transition hover:bg-zinc-900 hover:text-lime-400 sm:block"
          >
            Пүүз
          </Link>
          <Link
            href="/order"
            className="rounded-lg px-2 py-2 font-medium text-zinc-300 transition hover:bg-zinc-900 hover:text-lime-400 sm:px-3"
          >
            Захиалга<span className="hidden sm:inline"> шалгах</span>
          </Link>
          <Link
            href="/cart"
            className="relative ml-1 rounded-xl bg-lime-400 px-3 py-2 font-bold text-zinc-950 transition hover:bg-lime-300 sm:px-4"
          >
            🛒 Сагс
            {count > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 text-xs font-bold text-lime-400 ring-2 ring-lime-400">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
