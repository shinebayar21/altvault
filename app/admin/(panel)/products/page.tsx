import db, { Product } from "@/lib/db";
import { tugrug, minPriceInfo } from "@/lib/format";
import ToggleActive from "@/components/ToggleActive";
import DeleteProduct from "@/components/DeleteProduct";
import VariantMatrix from "@/components/VariantMatrix";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const products = db
    .prepare(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.created_at DESC`
    )
    .all() as Product[];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-extrabold uppercase">Бараанууд</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/categories"
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-lime-400 hover:text-lime-400"
          >
            🏷️ Категори удирдах
          </Link>
          <Link
            href="/admin/products/new"
            className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-bold text-zinc-950 transition hover:bg-lime-300"
          >
            + Шинэ бараа
          </Link>
        </div>
      </div>

      <div className="mb-3 text-xs text-zinc-500">
        Ногоон toggle = веб талд харагдана, унтраавал нуугдана. Доорх матрицын нүд бүр нэг өнгө ×
        размер хослол: <span className="text-lime-400">ногоон = байгаа</span>,{" "}
        <span className="text-red-400 line-through">улаан = дууссан</span> — дарж солино. Өнгөний
        нэр дээр дарвал тухайн өнгө бүхэлдээ солигдоно.
      </div>

      <div className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-900">
        {products.map((p) => (
          <div key={p.id} className={`p-3 ${!p.active ? "bg-zinc-950/50" : ""}`}>
            <div className="flex items-center gap-3 sm:gap-4">
              <ToggleActive id={p.id} active={!!p.active} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image}
                alt={p.name}
                className={`h-12 w-12 shrink-0 rounded-xl bg-zinc-800 object-cover ${!p.active ? "opacity-40 grayscale" : ""}`}
              />
              <div className="min-w-0 flex-1">
                <div className={`truncate font-medium ${!p.active ? "text-zinc-500" : ""}`}>
                  {p.name}
                  {!p.active && (
                    <span className="ml-2 rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] font-normal text-zinc-500">
                      нуугдсан
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-zinc-500">
                  {p.category_name || "Категоригүй"}
                </div>
              </div>
              <div className="shrink-0 text-right text-sm font-medium">
                {(() => {
                  const pi = minPriceInfo(p);
                  return (
                    <>
                      {pi.off && (
                        <div className="text-xs text-zinc-500 line-through">{tugrug(pi.base)}</div>
                      )}
                      <div className={pi.off ? "text-lime-400" : ""}>
                        {tugrug(pi.current)}
                        {pi.varies && <span className="text-xs font-normal text-zinc-500">-с</span>}
                      </div>
                    </>
                  );
                })()}
              </div>
              <Link
                href={`/admin/products/${p.id}`}
                className="shrink-0 rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-lime-400 hover:text-lime-400"
              >
                Засах
              </Link>
              <DeleteProduct id={p.id} name={p.name} />
            </div>
            <div className="mt-2 pl-14 sm:pl-[60px]">
              <VariantMatrix id={p.id} colors={p.colors} sizes={p.sizes} variantsOut={p.variants_out} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
