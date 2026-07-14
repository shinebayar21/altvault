"use client";

import { useOptimistic, useTransition } from "react";
import { setVariantsOut } from "@/lib/actions";
import { splitList, variantKey, parseVariantsOut } from "@/lib/format";

/**
 * Админд өнгө × размер хослол бүрийг дарж дууссан/байгаа болгодог матриц.
 * Ногоон нүд = байгаа, улаан зураастай = дууссан.
 * Өнгөний нэр дээр дарвал тухайн мөр бүхэлдээ солигдоно (бүгд дууссан ⇄ бүгд байгаа).
 */
export default function VariantMatrix({
  id,
  colors,
  sizes,
  variantsOut,
}: {
  id: number;
  colors: string;
  sizes: string;
  variantsOut: string;
}) {
  const colorList = splitList(colors);
  const sizeList = splitList(sizes);
  const [pending, startTransition] = useTransition();
  const [outSet, setOutSet] = useOptimistic(parseVariantsOut(variantsOut));

  if (colorList.length === 0 && sizeList.length === 0) return null;

  const apply = (keys: string[], out: boolean) =>
    startTransition(async () => {
      const next = new Set(outSet);
      for (const k of keys) (out ? next.add(k) : next.delete(k));
      setOutSet(next);
      await setVariantsOut(id, keys, out);
    });

  const cellCls = (out: boolean) =>
    `h-7 min-w-9 rounded-md border px-1.5 text-[11px] font-bold transition ${
      out
        ? "border-red-400/40 bg-red-400/10 text-red-400 line-through decoration-red-400/70"
        : "border-lime-400/40 bg-lime-400/10 text-lime-400"
    }`;

  // Зөвхөн размертай (өнгөгүй) бараа — нэг мөр размерын chip
  if (colorList.length === 0) {
    return (
      <div className={`flex flex-wrap gap-1 ${pending ? "opacity-70" : ""}`}>
        {sizeList.map((s) => {
          const k = variantKey("", s);
          const out = outSet.has(k);
          return (
            <button key={s} type="button" onClick={() => apply([k], !out)} className={cellCls(out)} title={out ? "Дууссан — дарж сэргээх" : "Байгаа — дарж дууссан болгох"}>
              {s}
            </button>
          );
        })}
      </div>
    );
  }

  // Зөвхөн өнгөтэй (размергүй) бараа — нэг мөр өнгөний chip
  if (sizeList.length === 0) {
    return (
      <div className={`flex flex-wrap gap-1 ${pending ? "opacity-70" : ""}`}>
        {colorList.map((c) => {
          const k = variantKey(c, "");
          const out = outSet.has(k);
          return (
            <button key={c} type="button" onClick={() => apply([k], !out)} className={cellCls(out)} title={out ? "Дууссан — дарж сэргээх" : "Байгаа — дарж дууссан болгох"}>
              {c}
            </button>
          );
        })}
      </div>
    );
  }

  // Бүтэн матриц: мөр = өнгө, багана = размер
  return (
    <div className={`overflow-x-auto ${pending ? "opacity-70" : ""}`}>
      <table className="border-separate border-spacing-1">
        <tbody>
          {colorList.map((c) => {
            const rowKeys = sizeList.map((s) => variantKey(c, s));
            const rowAllOut = rowKeys.every((k) => outSet.has(k));
            return (
              <tr key={c}>
                <td>
                  <button
                    type="button"
                    onClick={() => apply(rowKeys, !rowAllOut)}
                    title={rowAllOut ? "Бүх размерыг нь сэргээх" : "Энэ өнгийг бүхэлд нь дууссан болгох"}
                    className={`h-7 max-w-28 truncate rounded-md px-2 text-left text-[11px] font-semibold transition ${
                      rowAllOut
                        ? "bg-red-400/10 text-red-400 line-through"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    {c}
                  </button>
                </td>
                {sizeList.map((s) => {
                  const k = variantKey(c, s);
                  const out = outSet.has(k);
                  return (
                    <td key={s}>
                      <button
                        type="button"
                        onClick={() => apply([k], !out)}
                        className={cellCls(out)}
                        title={`${c} / ${s} — ${out ? "дууссан, дарж сэргээх" : "байгаа, дарж дууссан болгох"}`}
                      >
                        {s}
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
