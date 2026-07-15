import Link from "next/link";
import type { Product } from "@/lib/db";
import { tugrug, splitList, parseVariantsOut, allCombos, minPriceInfo } from "@/lib/format";

export default function ProductCard({ p }: { p: Product }) {
  const sizes = splitList(p.sizes);
  const colors = splitList(p.colors);
  const outSet = parseVariantsOut(p.variants_out);
  const combos = allCombos(colors, sizes);
  const allOut = combos.length > 0 && combos.every((k) => outSet.has(k));
  const someOut = !allOut && combos.some((k) => outSet.has(k));
  const pi = minPriceInfo(p);
  return (
    <Link
      href={`/products/${p.id}`}
      className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition duration-200 hover:-translate-y-1 hover:border-lime-400/50 hover:shadow-[0_8px_30px_rgba(163,230,53,0.12)]"
    >
      <div className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.image}
          alt={p.name}
          className="aspect-square w-full bg-zinc-800 object-cover transition duration-300 group-hover:scale-105"
        />
        {allOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/70">
            <span className="rounded-full border border-zinc-600 px-4 py-1.5 text-sm font-bold uppercase text-zinc-300">
              Дууссан
            </span>
          </div>
        )}
        {someOut && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-bold uppercase text-white">
            Зарим нь дууссан
          </span>
        )}
        {p.category_name && (
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-zinc-950/80 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 backdrop-blur-sm">
            {p.category_name}
          </span>
        )}
      </div>
      <div className="p-3.5">
        <div className="line-clamp-2 text-sm font-semibold text-zinc-100 transition group-hover:text-lime-400">
          {p.name}
        </div>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
          {pi.off && (
            <span className="text-sm font-semibold text-zinc-500 line-through">{tugrug(pi.base)}</span>
          )}
          <span className="font-display font-bold text-lime-400">
            {tugrug(pi.current)}
            {pi.varies && <span className="font-sans text-xs font-normal text-zinc-400">-с</span>}
          </span>
        </div>
        {sizes.length > 0 && (
          <div className="mt-1.5 truncate text-xs text-zinc-500">
            Размер: {sizes[0]}–{sizes[sizes.length - 1]}
          </div>
        )}
      </div>
    </Link>
  );
}
