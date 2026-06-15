"use client";

import { useActionState } from "react";
import { saveProduct } from "@/lib/actions";
import { Product, Category } from "@/lib/db";
import Link from "next/link";

export default function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(saveProduct, {});
  const input =
    "w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-white focus:outline-indigo-500";

  return (
    <form action={action} className="space-y-4 max-w-xl">
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Барааны нэр *</label>
          <input name="name" required defaultValue={product?.name} className={input} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Тайлбар</label>
          <textarea
            name="description"
            rows={4}
            defaultValue={product?.description}
            className={input}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Үнэ (₮) *</label>
            <input name="price" type="number" min="0" required defaultValue={product?.price} className={input} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Үлдэгдэл *</label>
            <input name="stock" type="number" min="0" required defaultValue={product?.stock ?? 0} className={input} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Категори</label>
          <select name="category_id" defaultValue={product?.category_id ?? ""} className={input}>
            <option value="">Категоригүй</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Зураг (jpg, png, webp — 5MB хүртэл)</label>
          {product?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt="" className="w-20 h-20 rounded-lg object-cover mb-2 bg-slate-100" />
          )}
          <input name="image" type="file" accept="image/*" className={input} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={product ? !!product.active : true} />
          Дэлгүүрт харагдана (идэвхтэй)
        </label>
      </div>

      {state.error && <div className="text-red-600 text-sm bg-red-50 rounded-lg p-3">{state.error}</div>}

      <div className="flex gap-3">
        <button
          disabled={pending}
          className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? "Хадгалж байна..." : "Хадгалах"}
        </button>
        <Link href="/admin/products" className="px-6 py-2.5 border border-slate-300 rounded-lg bg-white">
          Болих
        </Link>
      </div>
    </form>
  );
}
