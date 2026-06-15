"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export default function Header({ storeName }: { storeName: string }) {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          🛍️ {storeName}
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/" className="hover:text-indigo-600">
            Бараа
          </Link>
          <Link href="/order" className="hover:text-indigo-600">
            Захиалга шалгах
          </Link>
          <Link
            href="/cart"
            className="relative bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            🛒 Сагс
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
