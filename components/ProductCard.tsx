import Link from "next/link";
import { Product } from "@/lib/db";
import { tugrug } from "@/lib/format";

export default function ProductCard({ p }: { p: Product }) {
  return (
    <Link
      href={`/products/${p.id}`}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition group"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.image} alt={p.name} className="w-full aspect-square object-cover bg-slate-100" />
      <div className="p-3">
        <div className="text-sm font-medium line-clamp-2 group-hover:text-indigo-600">{p.name}</div>
        <div className="mt-1 font-bold text-indigo-600">{tugrug(p.price)}</div>
        <div className="mt-1 text-xs text-slate-500">
          {p.stock > 0 ? `Үлдэгдэл: ${p.stock}` : "Дууссан"}
        </div>
      </div>
    </Link>
  );
}
