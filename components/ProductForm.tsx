"use client";

import { useActionState, useState } from "react";
import { saveProduct } from "@/lib/actions";
import type { Product, Category } from "@/lib/db";
import { splitList, parseColorImages, parseColorPrices, MAX_COLOR_IMAGES } from "@/lib/format";
import Link from "next/link";

const QUICK_SIZES = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];

export default function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(saveProduct, {});
  const [sizes, setSizes] = useState<string[]>(splitList(product?.sizes));
  const [colors, setColors] = useState(product?.colors || "");
  const colorList = splitList(colors);
  const colorImages = parseColorImages(product?.color_images);
  const colorPrices = parseColorPrices(product?.color_prices);
  const input =
    "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-600 transition focus:border-lime-400 focus:outline-none";

  const toggleSize = (s: string) =>
    setSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s].sort((a, b) => Number(a) - Number(b))
    );

  return (
    <form action={action} className="max-w-xl space-y-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="sizes" value={sizes.join(",")} />
      <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">Барааны нэр *</label>
          <input name="name" required defaultValue={product?.name} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">Тайлбар</label>
          <textarea
            name="description"
            rows={4}
            defaultValue={product?.description}
            className={input}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Үнэ (₮) *</label>
            <input name="price" type="number" min="0" required defaultValue={product?.price} className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Хямдралтай үнэ (₮)</label>
            <input
              name="sale_price"
              type="number"
              min="0"
              placeholder="Хоосон = хямдралгүй"
              defaultValue={product?.sale_price || ""}
              className={input}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">Размер</label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSize(s)}
                className={`h-9 w-10 rounded-lg border text-sm font-bold transition ${
                  sizes.includes(s)
                    ? "border-lime-400 bg-lime-400 text-zinc-950"
                    : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-zinc-500">
            Сонгогдсон: {sizes.length > 0 ? sizes.join(", ") : "байхгүй (размергүй бараа)"}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">Өнгө</label>
          <input
            name="colors"
            value={colors}
            onChange={(e) => setColors(e.target.value)}
            placeholder="Жишээ: Хар, Цагаан, Volt"
            className={input}
          />
          <p className="mt-1.5 text-xs text-zinc-500">Өнгөнүүдийг таслалаар тусгаарлан бичнэ үү</p>
        </div>

        {colorList.length > 0 && (
          <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
            <div className="text-sm font-medium text-zinc-300">
              Өнгө бүрийн үнэ ба зураг — зураг {MAX_COLOR_IMAGES} хүртэл (заавал биш)
            </div>
            {colorList.map((c) => {
              const imgs = colorImages[c] || [];
              return (
                <div key={c} className="rounded-lg border border-zinc-800 p-2.5">
                  <div className="mb-2 text-sm font-semibold text-zinc-200">{c}</div>
                  <div className="mb-2.5 grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">Үнэ (₮) — хоосон бол үндсэн үнэ</label>
                      <input
                        name={`colorprice:${c}`}
                        type="number"
                        min="0"
                        placeholder={String(product?.price ?? "")}
                        defaultValue={colorPrices[c]?.price ?? ""}
                        className={input}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">Хямдралтай үнэ (₮)</label>
                      <input
                        name={`colorsale:${c}`}
                        type="number"
                        min="0"
                        placeholder="Хоосон = хямдралгүй"
                        defaultValue={colorPrices[c]?.sale ?? ""}
                        className={input}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Array.from({ length: MAX_COLOR_IMAGES }, (_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {imgs[i] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imgs[i]}
                            alt={`${c} ${i + 1}`}
                            className="h-11 w-11 shrink-0 rounded-lg bg-zinc-800 object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-700 text-xs text-zinc-600">
                            {i + 1}
                          </div>
                        )}
                        <input
                          name={`colorimg:${c}:${i}`}
                          type="file"
                          accept="image/*"
                          className={`min-w-0 flex-1 text-xs ${input}`}
                        />
                        {imgs[i] && (
                          <label
                            title="Хадгалахад энэ зургийг устгана"
                            className="flex shrink-0 cursor-pointer items-center gap-1 text-xs text-red-400"
                          >
                            <input type="checkbox" name={`colorimgdel:${c}:${i}`} className="accent-red-400" />
                            ✕
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-zinc-500">
              Хэрэглэгч тухайн өнгийг сонгоход эдгээр зургууд харагдана. Нүдэнд шинэ файл оруулбал
              хуучныг нь дарж бичнэ, ✕ чагтлаад хадгалбал устгана. Огт зураггүй өнгөнд үндсэн зураг хэвээр.
            </p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">Категори</label>
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
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            Зураг (jpg, png, webp — 5MB хүртэл)
          </label>
          {product?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt="" className="mb-2 h-20 w-20 rounded-xl bg-zinc-800 object-cover" />
          )}
          <input name="image" type="file" accept="image/*" className={input} />
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-300">
          <input
            type="checkbox"
            name="active"
            defaultChecked={product ? !!product.active : true}
            className="h-4 w-4 accent-lime-400"
          />
          Веб талд харагдана
        </label>
      </div>

      {state.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          disabled={pending}
          className="rounded-xl bg-lime-400 px-8 py-2.5 font-bold uppercase tracking-wide text-zinc-950 transition hover:bg-lime-300 disabled:opacity-50"
        >
          {pending ? "Хадгалж байна..." : "Хадгалах"}
        </button>
        <Link
          href="/admin/products"
          className="rounded-xl border border-zinc-700 px-6 py-2.5 text-zinc-300 transition hover:bg-zinc-900"
        >
          Болих
        </Link>
      </div>
    </form>
  );
}
