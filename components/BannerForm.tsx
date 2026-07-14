"use client";

import { useState } from "react";
import { addBanner, updateBanner } from "@/lib/actions";
import ActionForm from "@/components/ActionForm";
import { BANNER_FONTS, BANNER_POS_X, BANNER_POS_Y } from "@/lib/format";
import type { Banner } from "@/lib/db";

const POS_CELLS: { x: string; y: string; icon: string }[] = [
  { x: "left", y: "top", icon: "↖" },
  { x: "center", y: "top", icon: "↑" },
  { x: "right", y: "top", icon: "↗" },
  { x: "left", y: "center", icon: "←" },
  { x: "center", y: "center", icon: "●" },
  { x: "right", y: "center", icon: "→" },
  { x: "left", y: "bottom", icon: "↙" },
  { x: "center", y: "bottom", icon: "↓" },
  { x: "right", y: "bottom", icon: "↘" },
];

/** Реклам нэмэх/засах форм — фонт, өнгө, хэмжээ, байрлал, текстээ live урьдчилан харуулна */
export default function BannerForm({ banner }: { banner?: Banner }) {
  const [title, setTitle] = useState(banner?.title ?? "");
  const [subtitle, setSubtitle] = useState(banner?.subtitle ?? "");
  const [font, setFont] = useState(banner?.font && BANNER_FONTS[banner.font] ? banner.font : "display");
  const [color, setColor] = useState(banner?.color || "#ffffff");
  const [subtitleColor, setSubtitleColor] = useState(banner?.subtitle_color || "#ffffff");
  const [titleSize, setTitleSize] = useState(banner?.title_size || 48);
  const [subtitleSize, setSubtitleSize] = useState(banner?.subtitle_size || 18);
  const [posX, setPosX] = useState(banner?.pos_x && BANNER_POS_X[banner.pos_x] ? banner.pos_x : "left");
  const [posY, setPosY] = useState(banner?.pos_y && BANNER_POS_Y[banner.pos_y] ? banner.pos_y : "center");
  const [preview, setPreview] = useState(banner?.image || "");
  const fontDef = BANNER_FONTS[font] || BANNER_FONTS.display;
  // preview нь жинхэнэ hero-гоос ~2 дахин жижиг тул хэмжээг хувааж харуулна
  const SCALE = 0.5;
  const input =
    "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 transition focus:border-lime-400 focus:outline-none";

  return (
    <ActionForm
      action={banner ? updateBanner : addBanner}
      success={banner ? "Реклам хадгалагдлаа" : "Реклам нэмэгдлээ"}
      resetOnSuccess={!banner}
      className="space-y-2.5"
    >
      {banner && <input type="hidden" name="id" value={banner.id} />}
      <input type="hidden" name="pos_x" value={posX} />
      <input type="hidden" name="pos_y" value={posY} />

      {/* Урьдчилан харах */}
      <div className="relative aspect-video overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-600">
            Зураг сонгоно уу
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-zinc-950/55 to-zinc-950/25" />
        <div
          className={`absolute inset-0 flex flex-col px-5 py-4 ${BANNER_POS_X[posX]} ${BANNER_POS_Y[posY]}`}
        >
          <div
            className={`${fontDef.className} whitespace-pre-line font-extrabold leading-tight`}
            style={{ color, fontSize: titleSize * SCALE }}
          >
            {title || (preview ? "" : "Гарчиг энд гарна...")}
          </div>
          {subtitle && (
            <div
              className="mt-1.5"
              style={{ color: subtitleColor, opacity: 0.85, fontSize: subtitleSize * SCALE }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>

      <input
        name="image"
        type="file"
        accept="image/*"
        required={!banner}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setPreview(URL.createObjectURL(f));
        }}
        className={input}
      />
      <textarea
        name="title"
        rows={2}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Зурган дээр гарах гарчиг (Enter дарж мөр таслана; хоосон бол үндсэн текст)"
        className={input}
      />
      <input
        name="subtitle"
        value={subtitle}
        onChange={(e) => setSubtitle(e.target.value)}
        placeholder="Доорх жижиг тайлбар (заавал биш)"
        className={input}
      />
      <div className="flex flex-wrap gap-2">
        <select name="font" value={font} onChange={(e) => setFont(e.target.value)} className={`min-w-40 flex-1 ${input}`}>
          {Object.entries(BANNER_FONTS).map(([k, f]) => (
            <option key={k} value={k}>
              {f.label}
            </option>
          ))}
        </select>
        <label
          title="Гарчгийн өнгө"
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-3"
        >
          <span className="text-xs text-zinc-400">Гарчиг</span>
          <input
            type="color"
            name="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>
        <label
          title="Тайлбарын өнгө"
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-3"
        >
          <span className="text-xs text-zinc-400">Тайлбар</span>
          <input
            type="color"
            name="subtitle_color"
            value={subtitleColor}
            onChange={(e) => setSubtitleColor(e.target.value)}
            className="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-48 flex-1 space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5">
          <label className="block text-xs text-zinc-400">
            Гарчгийн хэмжээ — <span className="font-semibold text-zinc-200">{titleSize}px</span>
            <input
              type="range"
              name="title_size"
              min={16}
              max={120}
              value={titleSize}
              onChange={(e) => setTitleSize(Number(e.target.value))}
              className="mt-1 w-full accent-lime-400"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            Тайлбарын хэмжээ — <span className="font-semibold text-zinc-200">{subtitleSize}px</span>
            <input
              type="range"
              name="subtitle_size"
              min={10}
              max={48}
              value={subtitleSize}
              onChange={(e) => setSubtitleSize(Number(e.target.value))}
              className="mt-1 w-full accent-lime-400"
            />
          </label>
        </div>
        <div className="shrink-0 rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5">
          <div className="mb-1.5 text-center text-xs text-zinc-400">Байрлал</div>
          <div className="grid grid-cols-3 gap-1">
            {POS_CELLS.map((cell) => {
              const active = cell.x === posX && cell.y === posY;
              return (
                <button
                  key={`${cell.x}-${cell.y}`}
                  type="button"
                  title={`${cell.y}-${cell.x}`}
                  onClick={() => {
                    setPosX(cell.x);
                    setPosY(cell.y);
                  }}
                  className={`h-8 w-8 rounded-lg border text-sm transition ${
                    active
                      ? "border-lime-400 bg-lime-400 text-zinc-950"
                      : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  {cell.icon}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button className="w-full rounded-xl bg-lime-400 px-4 py-2 text-sm font-bold text-zinc-950 transition hover:bg-lime-300 disabled:opacity-50">
        {banner ? "Хадгалах" : "+ Реклам нэмэх"}
      </button>
    </ActionForm>
  );
}
