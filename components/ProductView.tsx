"use client";

import { useCallback, useRef, useState } from "react";
import type { Product } from "@/lib/db";
import { tugrug, parseColorImages, priceInfo, minPriceInfo } from "@/lib/format";
import AddToCart from "./AddToCart";

/** Барааны дэлгэрэнгүй — сонгосон өнгөний зургуудыг галерей хэлбэрээр харуулна */
export default function ProductView({ p }: { p: Product }) {
  const colorImages = parseColorImages(p.color_images);
  // Өнгө + сонгосон зургийн индексийг нэг state-д хадгална:
  // өнгө ЖИНХЭНЭ өөрчлөгдсөн үед л индекс 0 руу буцна, давхар дуудлагад үл хөдөлнө
  const [sel, setSel] = useState<{ color: string; idx: number }>({ color: "", idx: 0 });
  // Тогтвортой callback — AddToCart-ийн useEffect-ийг дахин ажиллуулж индексийг алдагдуулахгүй
  const galleryRef = useRef<HTMLDivElement>(null);
  const prevColor = useRef<string | null>(null);
  const setColor = useCallback((c: string) => {
    setSel((s) => (s.color === c ? s : { color: c, idx: 0 }));
    // Хэрэглэгч өнгө СОЛИХОД зураг дэлгэцээс гадуур бол түүн рүү гүйлгэнэ
    // (анхны автомат сонголтод гүйлгэхгүй; харагдаж байвал "nearest" тул no-op)
    const prev = prevColor.current;
    prevColor.current = c;
    if (prev === null || prev === c) return;
    galleryRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const imgs = sel.color && colorImages[sel.color]?.length ? colorImages[sel.color] : [p.image];
  const image = imgs[Math.min(sel.idx, imgs.length - 1)];

  // Hover zoom — курсорын байрлалаар томруулж харуулна
  const [zoom, setZoom] = useState<{ x: number; y: number; on: boolean }>({ x: 50, y: 50, on: false });

  return (
    <div className="mt-4 grid gap-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 md:grid-cols-2 md:p-8">
      <div ref={galleryRef} className="scroll-mt-20">
        <div
          className="relative cursor-zoom-in overflow-hidden rounded-2xl"
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({
              x: ((e.clientX - r.left) / r.width) * 100,
              y: ((e.clientY - r.top) / r.height) * 100,
              on: true,
            });
          }}
          onPointerLeave={() => setZoom((z) => ({ ...z, on: false }))}
          // Хүрэлтийн үед mouseleave ирдэггүй тул хуруу авахад заавал буцаана
          onPointerUp={() => setZoom((z) => ({ ...z, on: false }))}
          onPointerCancel={() => setZoom((z) => ({ ...z, on: false }))}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={image}
            src={image}
            alt={sel.color ? `${p.name} — ${sel.color}` : p.name}
            className="aspect-square w-full bg-zinc-800 object-cover transition-transform duration-150 ease-out"
            style={{
              transformOrigin: `${zoom.x}% ${zoom.y}%`,
              transform: zoom.on ? "scale(2.2)" : "scale(1)",
            }}
          />
        </div>
        {imgs.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {imgs.map((src, i) => (
              <button
                key={`${src}-${i}`}
                onClick={() => setSel((s) => ({ ...s, idx: i }))}
                className={`overflow-hidden rounded-xl border-2 transition ${
                  i === Math.min(sel.idx, imgs.length - 1)
                    ? "border-lime-400"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-16 w-16 bg-zinc-800 object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        {p.category_names && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {p.category_names.split(", ").map((n) => (
              <span
                key={n}
                className="inline-block rounded-full border border-lime-400/40 bg-lime-400/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-lime-400"
              >
                {n}
              </span>
            ))}
          </div>
        )}
        <h1 className="font-display text-3xl font-extrabold uppercase leading-tight">{p.name}</h1>
        {(() => {
          // Сонгосон өнгөний хямдрал/үнэ — өнгө солиход шууд шинэчлэгдэнэ;
          // өнгө сонгоогүй үед хамгийн бага үнийг "-с" дагавартай харуулна
          const pi = sel.color ? { ...priceInfo(p, sel.color), varies: false } : minPriceInfo(p);
          return (
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              {pi.off && (
                <span className="font-display text-xl font-semibold text-zinc-500 line-through">
                  {tugrug(pi.base)}
                </span>
              )}
              <span className="font-display text-3xl font-bold text-lime-400">
                {tugrug(pi.current)}
                {pi.varies && <span className="text-xl text-zinc-400">-с</span>}
              </span>
            </div>
          );
        })()}
        <p className="mt-5 whitespace-pre-line leading-relaxed text-zinc-300">{p.description}</p>
        <div className="mt-7 border-t border-zinc-800 pt-7">
          <AddToCart p={p} onColorChange={setColor} />
        </div>
      </div>
    </div>
  );
}
