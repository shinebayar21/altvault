"use client";

import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import type { Product } from "@/lib/db";
import { splitList, variantKey, parseVariantsOut, allCombos, parseColorImages, priceInfo } from "@/lib/format";

export default function AddToCart({
  p,
  onColorChange,
}: {
  p: Product;
  onColorChange?: (color: string) => void;
}) {
  const { add } = useCart();
  const sizes = splitList(p.sizes);
  const colors = splitList(p.colors);
  const outSet = parseVariantsOut(p.variants_out);
  const colorImages = parseColorImages(p.color_images);
  const combos = allCombos(colors, sizes);

  const isOut = (c: string, s: string) => outSet.has(variantKey(c, s));
  // Өнгө бүхэлдээ дууссан = тухайн өнгөний бүх размер (эсвэл размергүй хослол) дууссан
  const colorAllOut = (c: string) =>
    sizes.length === 0 ? isOut(c, "") : sizes.every((s) => isOut(c, s));
  // Тухайн размер бүх өнгөнд дууссан
  const sizeAllOut = (s: string) =>
    colors.length === 0 ? isOut("", s) : colors.every((c) => isOut(c, s));

  const [size, setSize] = useState("");
  const [color, setColor] = useState(() => {
    const avail = colors.filter((c) => !colorAllOut(c));
    return avail.length === 1 ? avail[0] : "";
  });
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [warn, setWarn] = useState("");

  // Сонгосон өнгийг эцэг компонентод мэдэгдэнэ (зураг солих г.м.)
  useEffect(() => {
    onColorChange?.(color);
  }, [color, onColorChange]);

  // Бүх хослол дууссан бол захиалах боломжгүй
  if (combos.length > 0 && combos.every((k) => outSet.has(k)))
    return (
      <div className="inline-block rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-semibold text-red-400">
        Дууссан — удахгүй дахин ирнэ
      </div>
    );

  const sizeDisabled = (s: string) => (color ? isOut(color, s) : sizeAllOut(s));
  const colorDisabled = (c: string) => (size ? isOut(c, size) : colorAllOut(c));

  const pickColor = (c: string) => {
    setColor(c);
    setWarn("");
    // шинэ өнгөнд одоо сонгосон размер байхгүй бол размерыг цэвэрлэнэ
    if (size && isOut(c, size)) setSize("");
  };
  const pickSize = (s: string) => {
    setSize(s);
    setWarn("");
    if (color && isOut(color, s)) setColor("");
  };

  const handleAdd = () => {
    if (sizes.length > 0 && !size) {
      setWarn("Размераа сонгоно уу");
      return;
    }
    if (colors.length > 0 && !color) {
      setWarn("Өнгөө сонгоно уу");
      return;
    }
    setWarn("");
    add(
      {
        id: p.id,
        name: p.name,
        price: priceInfo(p, color || undefined).current,
        image: (color && colorImages[color]?.[0]) || p.image,
        size,
        color,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="space-y-5">
      {colors.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Өнгө {color && <span className="text-lime-400">— {color}</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const disabled = colorDisabled(c);
              return (
                <button
                  key={c}
                  disabled={disabled}
                  title={disabled ? (size ? `${size} размерт энэ өнгө дууссан` : "Энэ өнгө дууссан") : undefined}
                  onClick={() => pickColor(c)}
                  className={`flex items-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition ${
                    colorImages[c]?.[0] ? "pl-2 pr-4" : "px-4"
                  } ${
                    disabled
                      ? "cursor-not-allowed border-zinc-800 bg-zinc-900/50 text-zinc-600 line-through"
                      : color === c
                        ? "border-lime-400 bg-lime-400 text-zinc-950"
                        : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  {colorImages[c]?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={colorImages[c][0]}
                      alt=""
                      className={`h-7 w-7 rounded-lg bg-zinc-800 object-cover ${disabled ? "opacity-40 grayscale" : ""}`}
                    />
                  )}
                  {c}
                  {disabled && (
                    <span className="ml-1.5 text-[10px] font-bold uppercase no-underline">дууссан</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Размер {size && <span className="text-lime-400">— {size}</span>}
            {color && (
              <span className="ml-2 text-[11px] font-normal normal-case text-zinc-500">
                ({color} өнгөнд байгаа размерууд)
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const disabled = sizeDisabled(s);
              return (
                <button
                  key={s}
                  disabled={disabled}
                  title={disabled ? (color ? `${color} өнгөнд ${s} размер дууссан` : "Энэ размер дууссан") : undefined}
                  onClick={() => pickSize(s)}
                  className={`h-11 w-12 rounded-xl border text-sm font-bold transition ${
                    disabled
                      ? "cursor-not-allowed border-zinc-800 bg-zinc-900/50 text-zinc-600 line-through"
                      : size === s
                        ? "border-lime-400 bg-lime-400 text-zinc-950"
                        : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {warn && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-400">
          {warn}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-xl border border-zinc-700 bg-zinc-900">
          <button
            className="px-4 py-3 text-zinc-300 hover:text-lime-400"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="min-w-10 text-center font-bold">{qty}</span>
          <button
            className="px-4 py-3 text-zinc-300 hover:text-lime-400"
            onClick={() => setQty((q) => Math.min(99, q + 1))}
          >
            +
          </button>
        </div>
        <button
          onClick={handleAdd}
          className="rounded-xl bg-lime-400 px-8 py-3 font-bold uppercase tracking-wide text-zinc-950 transition hover:bg-lime-300 hover:shadow-[0_0_24px_rgba(163,230,53,0.4)]"
        >
          {added ? "✓ Нэмэгдлээ" : "Сагсанд нэмэх"}
        </button>
      </div>
    </div>
  );
}
