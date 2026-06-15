import db, { Product } from "@/lib/db";
import { tugrug } from "@/lib/format";
import { deleteProduct, restoreProduct, addCategory } from "@/lib/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const products = db
    .prepare(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.active DESC, p.created_at DESC`
    )
    .all() as Product[];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Бараанууд</h1>
        <Link
          href="/admin/products/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
        >
          + Шинэ бараа
        </Link>
      </div>

      <form
        action={addCategory}
        className="mb-4 flex gap-2 bg-white rounded-xl border border-slate-200 p-3"
      >
        <input
          name="name"
          placeholder="Шинэ категори нэмэх..."
          className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-indigo-500"
        />
        <button className="text-sm bg-slate-800 text-white px-4 rounded-lg">Нэмэх</button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {products.map((p) => (
          <div key={p.id} className={`flex items-center gap-4 p-3 ${!p.active ? "opacity-50" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {p.name}
                {!p.active && <span className="text-xs text-red-500 ml-2">(идэвхгүй)</span>}
              </div>
              <div className="text-xs text-slate-500">
                {p.category_name || "Категоригүй"} · Үлдэгдэл: {p.stock}
              </div>
            </div>
            <div className="font-medium text-sm w-24 text-right">{tugrug(p.price)}</div>
            <Link
              href={`/admin/products/${p.id}`}
              className="text-sm text-indigo-600 hover:underline"
            >
              Засах
            </Link>
            {p.active ? (
              <form action={deleteProduct.bind(null, p.id)}>
                <button className="text-sm text-red-500 hover:underline">Хаах</button>
              </form>
            ) : (
              <form action={restoreProduct.bind(null, p.id)}>
                <button className="text-sm text-green-600 hover:underline">Сэргээх</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
