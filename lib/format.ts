export function tugrug(n: number): string {
  return n.toLocaleString("mn-MN") + "₮";
}

/** "40,41,42" маягийн утгыг массив болгоно (client талд ч ашиглагдана) */
export function splitList(v: string | null | undefined): string[] {
  return (v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ----- өнгө × размер хослолын availability -----
// variants_out багана нь дууссан хослолуудын JSON массив: ["Цагаан|41","Хар|42"]
// Өнгөгүй бараанд "" өнгө, размергүй бараанд "" размер ашиглана (ж: "Хар|", "|42").

export function variantKey(color: string, size: string): string {
  return `${color}|${size}`;
}

export function parseVariantsOut(v: string | null | undefined): Set<string> {
  try {
    const arr = JSON.parse(v || "[]");
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

/** Өнгө бүрд хамгийн ихдээ хэдэн зураг байж болох */
export const MAX_COLOR_IMAGES = 4;

/** Баннерын текстийн байрлал → flex/text-align классууд */
export const BANNER_POS_X: Record<string, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
};
export const BANNER_POS_Y: Record<string, string> = {
  top: "justify-start",
  center: "justify-center",
  bottom: "justify-end",
};

/** Реклам баннерын текстэд сонгож болох фонтууд (бүгд кирилл дэмжинэ) */
export const BANNER_FONTS: Record<string, { label: string; className: string }> = {
  display: { label: "Тод гарчиг — Unbounded", className: "font-display uppercase" },
  sans: { label: "Энгийн цэвэрхэн — Inter", className: "font-sans" },
  elegant: { label: "Гоёмсог сэриф — Playfair", className: "font-elegant" },
  hand: { label: "Гар бичмэл — Caveat", className: "font-hand" },
  mono: { label: "Техно моно", className: "font-mono" },
};

/**
 * color_images багана — өнгө бүрийн зургуудын JSON объект: {"Хар":["/api/uploads/x.jpg", ...]}
 * Хуучин формат ({"Хар":"url"} — нэг зураг) уншигдвал массив болгож хөрвүүлнэ.
 */
export function parseColorImages(v: string | null | undefined): Record<string, string[]> {
  try {
    const o = JSON.parse(v || "{}");
    if (o && typeof o === "object" && !Array.isArray(o)) {
      const out: Record<string, string[]> = {};
      for (const [k, val] of Object.entries(o)) {
        if (typeof val === "string" && val) out[k] = [val];
        else if (Array.isArray(val)) {
          const imgs = val.filter((x): x is string => typeof x === "string" && !!x).slice(0, MAX_COLOR_IMAGES);
          if (imgs.length) out[k] = imgs;
        }
      }
      return out;
    }
  } catch {}
  return {};
}

// ----- үнэ: хямдрал + өнгө бүрийн үнэ -----

/** color_prices багана — өнгө бүрийн үнэ/хямдралын JSON: {"Хар":{"price":150000,"sale":120000}} */
export type ColorPrice = { price?: number; sale?: number };

export function parseColorPrices(v: string | null | undefined): Record<string, ColorPrice> {
  try {
    const o = JSON.parse(v || "{}");
    if (o && typeof o === "object" && !Array.isArray(o)) {
      const out: Record<string, ColorPrice> = {};
      for (const [k, val] of Object.entries(o)) {
        if (!val || typeof val !== "object" || Array.isArray(val)) continue;
        const cp: ColorPrice = {};
        const { price, sale } = val as { price?: unknown; sale?: unknown };
        if (typeof price === "number" && Number.isFinite(price) && price > 0) cp.price = Math.floor(price);
        if (typeof sale === "number" && Number.isFinite(sale) && sale > 0) cp.sale = Math.floor(sale);
        if (cp.price !== undefined || cp.sale !== undefined) out[k] = cp;
      }
      return out;
    }
  } catch {}
  return {};
}

type Priced = { price: number; sale_price?: number; color_prices?: string };

/**
 * Сонгосон өнгийг харгалзсан хүчинтэй үнэ.
 * base — зурж харуулах хуучин үнэ, current — төлөх үнэ, off — хямдралтай эсэх.
 * Өнгөнд өөрийн үнэ байвал барааны түвшний хямдрал түүнд үйлчлэхгүй (өнгөний sale л үйлчилнэ);
 * өнгөнд зөвхөн sale байвал үндсэн үнийн эсрэг үйлчилнэ. Хямдрал 0 < sale < base үед л хүчинтэй.
 */
export function priceInfo(p: Priced, color?: string): { base: number; current: number; off: boolean } {
  const cp = color ? parseColorPrices(p.color_prices)[color] : undefined;
  const base = cp?.price ?? p.price;
  const sale = cp?.price !== undefined ? (cp.sale ?? 0) : (cp?.sale ?? p.sale_price ?? 0);
  const off = sale > 0 && sale < base;
  return { base, current: off ? sale : base, off };
}

/**
 * Барааны картад (өнгө сонгогдоогүй): бүх өнгөний доторх хамгийн бага төлөх үнэ.
 * varies — өнгөнүүдийн үнэ ялгаатай эсэх ("...₮-с" гэж харуулахад).
 */
export function minPriceInfo(
  p: Priced & { colors?: string }
): { base: number; current: number; off: boolean; varies: boolean } {
  const colors = splitList(p.colors);
  const infos = colors.length ? colors.map((c) => priceInfo(p, c)) : [priceInfo(p)];
  let min = infos[0];
  for (const i of infos) if (i.current < min.current) min = i;
  const varies = infos.some((i) => i.current !== min.current);
  return { ...min, varies };
}

/** Барааны бүх боломжит хослолын түлхүүрүүд (өнгө/размергүй бол хоосон массив) */
export function allCombos(colors: string[], sizes: string[]): string[] {
  if (colors.length === 0 && sizes.length === 0) return [];
  const cs = colors.length ? colors : [""];
  const ss = sizes.length ? sizes : [""];
  const out: string[] = [];
  for (const c of cs) for (const s of ss) out.push(variantKey(c, s));
  return out;
}

export const STATUS_LABEL: Record<string, string> = {
  pending: "Төлбөр хүлээгдэж буй",
  paid: "Төлөгдсөн",
  delivering: "Хүргэлтэнд гарсан",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцлагдсан",
};

export const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-400/15 text-amber-400 border border-amber-400/30",
  paid: "bg-lime-400/15 text-lime-400 border border-lime-400/30",
  delivering: "bg-violet-400/15 text-violet-400 border border-violet-400/30",
  delivered: "bg-sky-400/15 text-sky-400 border border-sky-400/30",
  cancelled: "bg-red-400/15 text-red-400 border border-red-400/30",
};
