"use client";

import { useEffect, useState } from "react";
import type { Banner } from "@/lib/db";
import { BANNER_FONTS, BANNER_POS_X, BANNER_POS_Y, parseBannerSegments } from "@/lib/format";

/**
 * Нүүрний hero — реклам зураг + түүн дээрх текст (фонт/өнгө нь админаас)
 * 5 секунд тутамд хамтдаа fade хийж солигдоно.
 */
export default function HeroSlides({ banners }: { banners: Banner[] }) {
  const n = banners.length;
  const [i, setI] = useState(0);

  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n]);

  if (n === 0) return null;
  const cur = i % n;

  return (
    <section className="relative mb-10 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 px-6 py-14 sm:px-12 sm:py-20">
      <div aria-hidden className="absolute inset-0">
        {banners.map((b, idx) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={b.id}
            src={b.image}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              idx === cur ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {/* текст уншигдахуйц байлгах бүдэгрүүлэлт */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-zinc-950/55 to-zinc-950/25" />
      </div>

      <div className="relative">
        <div className="grid min-h-[260px] sm:min-h-[340px]">
          {banners.map((b, idx) => {
            const font = BANNER_FONTS[b.font] || BANNER_FONTS.display;
            const posX = BANNER_POS_X[b.pos_x] || BANNER_POS_X.left;
            const posY = BANNER_POS_Y[b.pos_y] || BANNER_POS_Y.center;
            // Хэсэгчилсэн загвартай бол үг/үсэг бүр өөрийн фонт, өнгөтэй гарна
            const segs = parseBannerSegments(b.title_segments);
            return (
              <div
                key={b.id}
                style={{ gridArea: "1 / 1" }}
                className={`flex flex-col ${posX} ${posY} transition-opacity duration-1000 ${
                  idx === cur ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                {b.title ? (
                  <>
                    <h1
                      className={`${font.className} max-w-2xl whitespace-pre-line font-extrabold leading-tight`}
                      style={{
                        color: b.color || "#ffffff",
                        fontSize: `clamp(20px, ${((b.title_size || 48) / 12.8).toFixed(2)}vw, ${b.title_size || 48}px)`,
                      }}
                    >
                      {segs
                        ? segs.map((s, si) => (
                            <span
                              key={si}
                              className={s.f ? BANNER_FONTS[s.f].className : undefined}
                              style={s.c ? { color: s.c } : undefined}
                            >
                              {s.t}
                              {s.br ? "\n" : ""}
                            </span>
                          ))
                        : b.title}
                    </h1>
                    {b.subtitle && (
                      <p
                        className={`${font.className} mt-4 max-w-md`}
                        style={{
                          color: b.subtitle_color || "#ffffff",
                          opacity: 0.85,
                          fontSize: `clamp(12px, ${((b.subtitle_size || 18) / 12.8).toFixed(2)}vw, ${b.subtitle_size || 18}px)`,
                        }}
                      >
                        {b.subtitle}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mb-4 inline-block rounded-full border border-lime-400/40 bg-lime-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-lime-400">
                      Шинэ загварууд ирлээ 🔥
                    </div>
                    <h1 className="font-display max-w-2xl text-4xl font-extrabold uppercase leading-tight sm:text-6xl">
                      Алхам бүр
                      <br />
                      <span className="text-lime-400">Стиль</span> байг
                    </h1>
                    <p className="mt-4 max-w-md text-zinc-300">
                      Гудамжны соёлоос спортын талбай хүртэл — чиний хөлд тохирох шилдэг пүүзнүүд.
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <a
          href="#catalog"
          className="mt-7 inline-block rounded-xl bg-lime-400 px-8 py-3.5 font-bold uppercase tracking-wide text-zinc-950 transition hover:bg-lime-300 hover:shadow-[0_0_30px_rgba(163,230,53,0.35)]"
        >
          Пүүз үзэх ↓
        </a>
      </div>
    </section>
  );
}
