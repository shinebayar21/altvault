"use client";

import { useActionState, useRef, useState } from "react";
import { saveProduct } from "@/lib/actions";
import type { Product, Category } from "@/lib/db";
import { splitList, parseColorImages, parseColorPrices, MAX_COLOR_IMAGES } from "@/lib/format";
import { shrinkInputImages } from "@/lib/image";
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
  // Өнгөнүүд — нэг нэгээр нэмдэг жагсаалт; orig = DB дахь хуучин нэр
  // (нэр солиход зураг/үнэ/дууссан-төлөвийг сервер талд дагуулахад ашиглана)
  const uidRef = useRef(0);
  // Размерууд — өнгөтэй адил нэмэх/засах/хасах жагсаалт; orig нь нэр солиход
  // "дууссан" хослолын төлөвийг сервер талд дагуулна
  const [sizeItems, setSizeItems] = useState<{ key: string; name: string; orig: string }[]>(() =>
    splitList(product?.sizes).map((s) => ({ key: `db:${s}`, name: s, orig: s }))
  );
  const [newSize, setNewSize] = useState("");
  const [sizeEditKey, setSizeEditKey] = useState<string | null>(null);
  const [sizeEditVal, setSizeEditVal] = useState("");
  const [colorItems, setColorItems] = useState<{ key: string; name: string; orig: string }[]>(() =>
    splitList(product?.colors).map((c) => ({ key: `db:${c}`, name: c, orig: c }))
  );
  const [newColor, setNewColor] = useState("");
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  // Том зургийг сонгомогц браузер дээр багасгана; дуустал хадгалахыг түгжинэ
  const [shrinking, setShrinking] = useState(0);
  const shrinkOnChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    setShrinking((n) => n + 1);
    try {
      await shrinkInputImages(el);
    } finally {
      setShrinking((n) => n - 1);
    }
  };
  const colorImages = parseColorImages(product?.color_images);
  const colorPrices = parseColorPrices(product?.color_prices);

  // Таслал нь жагсаалтын тусгаарлагч тул өнгөний нэрэнд орохгүй
  const cleanColor = (v: string) => v.replace(/,/g, "").trim();
  const addColor = () => {
    const v = cleanColor(newColor);
    if (!v || colorItems.some((it) => it.name === v)) return;
    setColorItems((prev) => [...prev, { key: `new:${uidRef.current++}`, name: v, orig: "" }]);
    setNewColor("");
  };
  const renameColor = (key: string) => {
    const v = cleanColor(editVal);
    if (!v || colorItems.some((it) => it.key !== key && it.name === v)) return;
    setColorItems((prev) => prev.map((it) => (it.key === key ? { ...it, name: v } : it)));
    setEditKey(null);
  };
  const removeColor = (key: string) => setColorItems((prev) => prev.filter((it) => it.key !== key));
  const input =
    "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-600 transition focus:border-lime-400 focus:outline-none";
  // Тоон талбар дээр хулгана байхад хуудас гүйлгэхэд browser утгыг өөрчилдгөөс сэргийлнэ
  const noWheel = (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur();

  // Таслал нь жагсаалтын, | нь өнгө×размер хослолын тусгаарлагч тул размерын нэрэнд орохгүй
  const cleanSize = (v: string) => v.replace(/[,|]/g, "").trim();
  const sizeNum = (s: string) => {
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : Infinity;
  };
  const sortSizes = (arr: { key: string; name: string; orig: string }[]) =>
    [...arr].sort((a, b) => sizeNum(a.name) - sizeNum(b.name) || a.name.localeCompare(b.name));
  const addSize = (v0?: string) => {
    const v = cleanSize(v0 ?? newSize);
    if (!v || sizeItems.some((it) => it.name === v)) return;
    setSizeItems((prev) => sortSizes([...prev, { key: `new:${uidRef.current++}`, name: v, orig: "" }]));
    setNewSize("");
  };
  const toggleQuickSize = (s: string) =>
    setSizeItems((prev) =>
      prev.some((it) => it.name === s)
        ? prev.filter((it) => it.name !== s)
        : sortSizes([...prev, { key: `new:${uidRef.current++}`, name: s, orig: "" }])
    );
  const renameSize = (key: string) => {
    const v = cleanSize(sizeEditVal);
    if (!v || sizeItems.some((it) => it.key !== key && it.name === v)) return;
    setSizeItems((prev) => sortSizes(prev.map((it) => (it.key === key ? { ...it, name: v } : it))));
    setSizeEditKey(null);
  };
  const removeSize = (key: string) => setSizeItems((prev) => prev.filter((it) => it.key !== key));

  return (
    <form action={action} className="max-w-xl space-y-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="sizes" value={sizeItems.map((it) => it.name).join(",")} />
      <input type="hidden" name="colors" value={colorItems.map((it) => it.name).join(",")} />
      {colorItems
        .filter((it) => it.orig && it.orig !== it.name)
        .map((it) => (
          <input key={it.key} type="hidden" name={`colororig:${it.name}`} value={it.orig} />
        ))}
      {sizeItems
        .filter((it) => it.orig && it.orig !== it.name)
        .map((it) => (
          <input key={it.key} type="hidden" name={`sizeorig:${it.name}`} value={it.orig} />
        ))}
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
            <input name="price" type="number" min="0" required defaultValue={product?.price} onWheel={noWheel} className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Хямдралтай үнэ (₮)</label>
            <input
              name="sale_price"
              type="number"
              min="0"
              placeholder="Хоосон = хямдралгүй"
              defaultValue={product?.sale_price || ""}
              onWheel={noWheel}
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
                onClick={() => toggleQuickSize(s)}
                className={`h-9 w-10 rounded-lg border text-sm font-bold transition ${
                  sizeItems.some((it) => it.name === s)
                    ? "border-lime-400 bg-lime-400 text-zinc-950"
                    : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSize();
                }
              }}
              placeholder="Өөр размер: 34, 47, 42.5..."
              className={input}
            />
            <button
              type="button"
              onClick={() => addSize()}
              className="shrink-0 rounded-xl border border-lime-400/50 px-4 text-sm font-bold text-lime-400 transition hover:bg-lime-400 hover:text-zinc-950"
            >
              + Нэмэх
            </button>
          </div>
          {sizeItems.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sizeItems.map((it) =>
                sizeEditKey === it.key ? (
                  <span
                    key={it.key}
                    className="flex items-center gap-1.5 rounded-lg border border-lime-400/60 bg-zinc-950 px-2 py-1"
                  >
                    <input
                      autoFocus
                      value={sizeEditVal}
                      onChange={(e) => setSizeEditVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          renameSize(it.key);
                        }
                        if (e.key === "Escape") setSizeEditKey(null);
                      }}
                      className="w-16 rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-sm text-zinc-100 focus:border-lime-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => renameSize(it.key)}
                      className="text-sm font-bold text-lime-400 hover:text-lime-300"
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => setSizeEditKey(null)}
                      className="text-sm text-zinc-500 hover:text-zinc-300"
                    >
                      ✕
                    </button>
                  </span>
                ) : (
                  <span
                    key={it.key}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-sm font-semibold text-zinc-200"
                  >
                    {it.name}
                    <button
                      type="button"
                      title="Размер солих (дууссан төлөв хадгалагдана)"
                      onClick={() => {
                        setSizeEditKey(it.key);
                        setSizeEditVal(it.name);
                      }}
                      className="text-zinc-400 transition hover:text-lime-400"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      title="Устгах"
                      onClick={() => removeSize(it.key)}
                      className="text-zinc-400 transition hover:text-red-400"
                    >
                      ✕
                    </button>
                  </span>
                )
              )}
            </div>
          )}
          <p className="mt-1.5 text-xs text-zinc-500">
            Дээрх товчоор түгээмэл размер нэмж/хасна, талбараар дурын размер (34, 47, 42.5 г.м.)
            нэмнэ. ✎ — солих, ✕ — хасах. Хоосон бол размергүй бараа.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">Өнгө</label>
          <div className="flex gap-2">
            <input
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addColor();
                }
              }}
              placeholder="Жишээ: Хар"
              className={input}
            />
            <button
              type="button"
              onClick={addColor}
              className="shrink-0 rounded-xl border border-lime-400/50 px-4 text-sm font-bold text-lime-400 transition hover:bg-lime-400 hover:text-zinc-950"
            >
              + Нэмэх
            </button>
          </div>
          {colorItems.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {colorItems.map((it) => (
                <li
                  key={it.key}
                  className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2"
                >
                  {editKey === it.key ? (
                    <>
                      <input
                        autoFocus
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            renameColor(it.key);
                          }
                          if (e.key === "Escape") setEditKey(null);
                        }}
                        className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-sm text-zinc-100 focus:border-lime-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => renameColor(it.key)}
                        className="shrink-0 text-sm font-bold text-lime-400 hover:text-lime-300"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditKey(null)}
                        className="shrink-0 text-sm text-zinc-500 hover:text-zinc-300"
                      >
                        Болих
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-200">
                        {it.name}
                      </span>
                      <button
                        type="button"
                        title="Нэр солих"
                        onClick={() => {
                          setEditKey(it.key);
                          setEditVal(it.name);
                        }}
                        className="shrink-0 text-sm text-zinc-400 transition hover:text-lime-400"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        title="Устгах"
                        onClick={() => removeColor(it.key)}
                        className="shrink-0 text-sm text-zinc-400 transition hover:text-red-400"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-1.5 text-xs text-zinc-500">
            Өнгө бичээд «Нэмэх» (Enter) дарж нэг нэгээр нэмнэ. ✎ — нэр солих (зураг, үнэ нь
            хадгалагдана), ✕ — устгах. Өөрчлөлт «Хадгалах» дарахад орно.
          </p>
        </div>

        {colorItems.length > 0 && (
          <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
            <div className="text-sm font-medium text-zinc-300">
              Өнгө бүрийн үнэ ба зураг — зураг {MAX_COLOR_IMAGES} хүртэл (заавал биш)
            </div>
            {colorItems.map((it) => {
              const c = it.name;
              // DB дахь зураг/үнэ хуучин нэрээр нь хадгалагдсан байгаа
              const src = it.orig || it.name;
              const imgs = colorImages[src] || [];
              return (
                <div key={it.key} className="rounded-lg border border-zinc-800 p-2.5">
                  <div className="mb-2 text-sm font-semibold text-zinc-200">{c}</div>
                  <div className="mb-2.5 grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">Үнэ (₮) — хоосон бол үндсэн үнэ</label>
                      <input
                        name={`colorprice:${c}`}
                        type="number"
                        min="0"
                        placeholder={String(product?.price ?? "")}
                        defaultValue={colorPrices[src]?.price ?? ""}
                        onWheel={noWheel}
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
                        defaultValue={colorPrices[src]?.sale ?? ""}
                        onWheel={noWheel}
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
                          onChange={shrinkOnChange}
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
          <input name="image" type="file" accept="image/*" onChange={shrinkOnChange} className={input} />
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
          disabled={pending || shrinking > 0}
          className="rounded-xl bg-lime-400 px-8 py-2.5 font-bold uppercase tracking-wide text-zinc-950 transition hover:bg-lime-300 disabled:opacity-50"
        >
          {shrinking > 0 ? "Зураг бэлдэж байна..." : pending ? "Хадгалж байна..." : "Хадгалах"}
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
