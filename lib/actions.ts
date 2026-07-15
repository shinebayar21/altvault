"use server";

import db from "@/lib/db";
import {
  splitList,
  allCombos,
  parseVariantsOut,
  parseColorImages,
  variantKey,
  MAX_COLOR_IMAGES,
  type ColorPrice,
  BANNER_FONTS,
  BANNER_POS_X,
  BANNER_POS_Y,
} from "@/lib/format";
import { makeToken, requireAdmin, AUTH_COOKIE } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";

// ---------- Нэвтрэлт ----------
export async function loginAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const username = ((formData.get("username") as string) || "").trim();
  const password = formData.get("password") as string;
  if (
    username !== (process.env.ADMIN_USER || "admin") ||
    password !== (process.env.ADMIN_PASSWORD || "admin123")
  ) {
    return { error: "Нэвтрэх нэр эсвэл нууц үг буруу байна" };
  }
  const c = await cookies();
  c.set(AUTH_COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  redirect("/admin");
}

export async function logoutAction() {
  const c = await cookies();
  c.delete(AUTH_COOKIE);
  redirect("/admin/login");
}

// ---------- Захиалга ----------
// Үлдэгдэл тооцдоггүй (захиалга авч өгдөг сайт) тул статус солиход stock-д нөлөөлөхгүй
export async function setOrderStatus(orderId: number, status: string) {
  await requireAdmin();
  if (!["pending", "paid", "delivering", "delivered", "cancelled"].includes(status)) return;
  const order = db.prepare("SELECT id FROM orders WHERE id = ?").get(orderId);
  if (!order) return;
  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, orderId);
  revalidatePath("/admin/orders");
}

// ---------- Upload файлын цэвэрлэгээ ----------
const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

/** /api/uploads/... URL-ыг диск дээрх аюулгүй зам болгоно (өөр зам бол null) */
function uploadPathOf(url: string): string | null {
  if (!url || !url.startsWith("/api/uploads/")) return null;
  const name = path.basename(url);
  if (!/^[\w.-]+$/.test(name) || name.includes("..")) return null;
  return path.join(UPLOADS_DIR, name);
}

/** URL DB-ийн аль нэг газар ашиглагдаж байгаа эсэх */
function uploadIsUsed(url: string): boolean {
  return !!(
    db.prepare("SELECT 1 FROM products WHERE image = ? OR color_images LIKE ? LIMIT 1").get(url, `%${url}%`) ||
    db.prepare("SELECT 1 FROM categories WHERE image = ? LIMIT 1").get(url) ||
    db.prepare("SELECT 1 FROM banners WHERE image = ? LIMIT 1").get(url) ||
    db.prepare("SELECT 1 FROM settings WHERE value = ? LIMIT 1").get(url)
  );
}

/** Хэрэггүй болсон upload файлыг устгана — DB-д хаана ч ашиглагдахгүй болсон үед л */
function deleteUploadIfUnused(url: string | null | undefined) {
  if (!url) return;
  const p = uploadPathOf(url);
  if (!p || uploadIsUsed(url)) return;
  try {
    fs.unlinkSync(p);
  } catch {}
}

// ---------- Бараа ----------
async function saveImage(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > 5 * 1024 * 1024) throw new Error("Зураг 5MB-аас бага байх ёстой");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const name = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "data", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(dir, name), buf);
  return `/api/uploads/${name}`;
}

export async function saveProduct(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();
  const id = Number(formData.get("id") || 0);
  const name = (formData.get("name") as string)?.trim();
  const description = ((formData.get("description") as string) || "").trim();
  const price = Math.floor(Number(formData.get("price")));
  const category_id = Number(formData.get("category_id")) || null;
  const active = formData.get("active") ? 1 : 0;
  const normList = (v: FormDataEntryValue | null) =>
    String(v || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .join(",");
  const sizes = normList(formData.get("sizes"));
  const colors = normList(formData.get("colors"));

  if (!name || !price || price < 0) return { error: "Нэр, үнээ зөв бөглөнө үү" };

  // Хямдралтай үнэ (₮, шууд дүнгээр) — хоосон бол 0 = хямдралгүй
  const readPrice = (v: FormDataEntryValue | null): number => {
    const n = Math.floor(Number(String(v ?? "").trim()));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const sale_price = readPrice(formData.get("sale_price"));
  if (sale_price && sale_price >= price)
    return { error: "Хямдралтай үнэ үндсэн үнээс бага байх ёстой" };

  // Өнгө бүрийн үнэ/хямдрал — хоосон талбар нь үндсэн үнэ/хямдралдаа үлдэнэ
  const colorPrices: Record<string, ColorPrice> = {};
  for (const c of splitList(colors)) {
    const cp: ColorPrice = {};
    const cPrice = readPrice(formData.get(`colorprice:${c}`));
    const cSale = readPrice(formData.get(`colorsale:${c}`));
    if (cPrice) cp.price = cPrice;
    if (cSale) {
      if (cSale >= (cPrice || price))
        return { error: `"${c}" өнгөний хямдралтай үнэ үнээсээ бага байх ёстой` };
      cp.sale = cSale;
    }
    if (cp.price !== undefined || cp.sale !== undefined) colorPrices[c] = cp;
  }
  const color_prices = JSON.stringify(colorPrices);

  // Хэрэггүй болсон хуучин зургууд (DB бичилт амжилттай болсны ДАРАА устгана)
  const removedUploads: string[] = [];
  // Энэ хүсэлтээр шинээр хадгалсан файлууд (алдаа гарвал буцааж устгана)
  const newUploads: string[] = [];
  const rollback = () => {
    for (const u of newUploads) {
      const p = uploadPathOf(u);
      if (p) try { fs.unlinkSync(p); } catch {}
    }
  };

  let image: string | null = null;
  try {
    image = await saveImage(formData.get("image") as File | null);
    if (image) newUploads.push(image);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Зураг хадгалахад алдаа гарлаа" };
  }

  const prev = id
    ? (db.prepare("SELECT image, variants_out, color_images FROM products WHERE id = ?").get(id) as
        | { image: string; variants_out: string; color_images: string }
        | undefined)
    : undefined;
  // Үндсэн зураг солигдвол хуучныг устгах жагсаалтад
  if (image && prev?.image) removedUploads.push(prev.image);

  // Өнгө бүрийн зураг (4 хүртэл нүд): нүд бүрд устгах чекбокс + шинэ файл оруулбал дарж бичнэ,
  // жагсаалтаас хасагдсан өнгөнийх автоматаар цэвэрлэгдэнэ
  const colorList = splitList(colors);
  const prevColorImages = parseColorImages(prev?.color_images);
  // Нэр солигдсон өнгө: form-оос colororig:<шинэ нэр> = хуучин нэр ирдэг —
  // зураг, дууссан-төлөвийг хуучин нэрээс нь дагуулна
  const origOf = (c: string) => {
    const o = formData.get(`colororig:${c}`);
    return typeof o === "string" && o ? o : c;
  };
  const colorImages: Record<string, string[]> = {};
  for (const c of colorList) {
    const slots: (string | null)[] = Array.from(
      { length: MAX_COLOR_IMAGES },
      (_, i) => prevColorImages[origOf(c)]?.[i] ?? null
    );
    for (let i = 0; i < MAX_COLOR_IMAGES; i++) {
      if (formData.get(`colorimgdel:${c}:${i}`) && slots[i]) {
        removedUploads.push(slots[i] as string);
        slots[i] = null;
      }
      try {
        const img = await saveImage(formData.get(`colorimg:${c}:${i}`) as File | null);
        if (img) {
          if (slots[i]) removedUploads.push(slots[i] as string);
          slots[i] = img;
          newUploads.push(img);
        }
      } catch (e) {
        rollback();
        return { error: e instanceof Error ? e.message : `"${c}" өнгөний зураг хадгалахад алдаа гарлаа` };
      }
    }
    const imgs = slots.filter((s): s is string => !!s);
    if (imgs.length) colorImages[c] = imgs;
  }
  // Жагсаалтаас хасагдсан өнгөний зургууд мөн хэрэггүй боллоо
  const keptOrig = new Set(colorList.map(origOf));
  for (const [c, imgs] of Object.entries(prevColorImages)) {
    if (!keptOrig.has(c)) removedUploads.push(...imgs);
  }
  const color_images = JSON.stringify(colorImages);

  if (id) {
    // Өнгө/размерын жагсаалт өөрчлөгдвөл хүчингүй болсон хослолуудыг цэвэрлэнэ;
    // нэр солигдсон өнгөний "дууссан" хослолуудыг шинэ нэр рүү нь шилжүүлнэ
    const renamed = new Map(colorList.map((c) => [origOf(c), c] as const));
    const valid = new Set(allCombos(colorList, splitList(sizes)));
    const variants_out = JSON.stringify(
      [...parseVariantsOut(prev?.variants_out)]
        .map((k) => {
          const i = k.indexOf("|");
          if (i < 0) return k;
          const nc = renamed.get(k.slice(0, i));
          return nc ? variantKey(nc, k.slice(i + 1)) : k;
        })
        .filter((k) => valid.has(k))
    );
    if (image) {
      db.prepare(
        "UPDATE products SET name=?, description=?, price=?, sale_price=?, sizes=?, colors=?, variants_out=?, color_images=?, color_prices=?, category_id=?, active=?, image=? WHERE id=?"
      ).run(name, description, price, sale_price, sizes, colors, variants_out, color_images, color_prices, category_id, active, image, id);
    } else {
      db.prepare(
        "UPDATE products SET name=?, description=?, price=?, sale_price=?, sizes=?, colors=?, variants_out=?, color_images=?, color_prices=?, category_id=?, active=? WHERE id=?"
      ).run(name, description, price, sale_price, sizes, colors, variants_out, color_images, color_prices, category_id, active, id);
    }
  } else {
    db.prepare(
      "INSERT INTO products (name, description, price, sale_price, sizes, colors, color_images, color_prices, category_id, active, image) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
    ).run(name, description, price, sale_price, sizes, colors, color_images, color_prices, category_id, active, image || "/img/placeholder.svg");
  }
  // DB шинэчлэгдсэн тул хэрэггүй болсон файлуудыг устгана
  for (const u of removedUploads) deleteUploadIfUnused(u);
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProduct(id: number) {
  await requireAdmin();
  db.prepare("UPDATE products SET active = 0 WHERE id = ?").run(id);
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function restoreProduct(id: number) {
  await requireAdmin();
  db.prepare("UPDATE products SET active = 1 WHERE id = ?").run(id);
  revalidatePath("/admin/products");
  revalidatePath("/");
}

/** Веб талд харагдах эсэхийг toggle хийнэ */
export async function toggleProduct(id: number, active: boolean) {
  await requireAdmin();
  db.prepare("UPDATE products SET active = ? WHERE id = ?").run(active ? 1 : 0, id);
  revalidatePath("/admin/products");
  revalidatePath("/");
}

/** Өгөгдсөн өнгө×размер хослолуудыг дууссан (out=true) эсвэл байгаа (out=false) болгоно */
export async function setVariantsOut(id: number, keys: string[], out: boolean) {
  await requireAdmin();
  const row = db.prepare("SELECT sizes, colors, variants_out FROM products WHERE id = ?").get(id) as
    | { sizes: string; colors: string; variants_out: string }
    | undefined;
  if (!row) return;
  const valid = new Set(allCombos(splitList(row.colors), splitList(row.sizes)));
  const cur = parseVariantsOut(row.variants_out);
  for (const k of keys) {
    if (!valid.has(k)) continue;
    if (out) cur.add(k);
    else cur.delete(k);
  }
  db.prepare("UPDATE products SET variants_out = ? WHERE id = ?").run(JSON.stringify([...cur]), id);
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath(`/products/${id}`);
}

// ---------- Категори ----------
function revalidateCategories() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function addCategory(formData: FormData) {
  await requireAdmin();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;
  const slug =
    name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9а-яөү-]/g, "") || `cat-${Date.now()}`;
  let image = "";
  try {
    image = (await saveImage(formData.get("image") as File | null)) || "";
  } catch {}
  try {
    db.prepare("INSERT INTO categories (name, slug, image) VALUES (?, ?, ?)").run(name, slug, image);
  } catch {}
  revalidateCategories();
}

export async function updateCategory(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = (formData.get("name") as string)?.trim();
  if (!id || !name) return;
  let image: string | null = null;
  try {
    image = await saveImage(formData.get("image") as File | null);
  } catch {}
  const prev = db.prepare("SELECT image FROM categories WHERE id = ?").get(id) as
    | { image: string }
    | undefined;
  // slug-ийг өөрчлөхгүй — хуучин линкүүд хэвээр ажиллана
  try {
    if (image) {
      db.prepare("UPDATE categories SET name = ?, image = ? WHERE id = ?").run(name, image, id);
    } else {
      db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name, id);
    }
  } catch {}
  if (image) deleteUploadIfUnused(prev?.image);
  revalidateCategories();
}

export async function removeCategoryImage(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  const prev = db.prepare("SELECT image FROM categories WHERE id = ?").get(id) as
    | { image: string }
    | undefined;
  db.prepare("UPDATE categories SET image = '' WHERE id = ?").run(id);
  deleteUploadIfUnused(prev?.image);
  revalidateCategories();
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  const prev = db.prepare("SELECT image FROM categories WHERE id = ?").get(id) as
    | { image: string }
    | undefined;
  // FK: ON DELETE SET NULL — бараанууд устахгүй, "Категоригүй" болно
  db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  deleteUploadIfUnused(prev?.image);
  revalidateCategories();
}

// ---------- Реклам (нүүрний слайд) ----------
function bannerTextFields(formData: FormData) {
  const title = ((formData.get("title") as string) || "").trim();
  const subtitle = ((formData.get("subtitle") as string) || "").trim();
  let font = (formData.get("font") as string) || "display";
  if (!BANNER_FONTS[font]) font = "display";
  let color = ((formData.get("color") as string) || "#ffffff").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) color = "#ffffff";
  let subtitle_color = ((formData.get("subtitle_color") as string) || "#ffffff").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(subtitle_color)) subtitle_color = "#ffffff";
  const clampInt = (v: FormDataEntryValue | null, min: number, max: number, def: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
  };
  const title_size = clampInt(formData.get("title_size"), 16, 120, 48);
  const subtitle_size = clampInt(formData.get("subtitle_size"), 10, 48, 18);
  let pos_x = (formData.get("pos_x") as string) || "left";
  if (!BANNER_POS_X[pos_x]) pos_x = "left";
  let pos_y = (formData.get("pos_y") as string) || "center";
  if (!BANNER_POS_Y[pos_y]) pos_y = "center";
  return { title, subtitle, font, color, subtitle_color, title_size, subtitle_size, pos_x, pos_y };
}

export async function addBanner(formData: FormData) {
  await requireAdmin();
  let image: string | null = null;
  try {
    image = await saveImage(formData.get("image") as File | null);
  } catch {}
  if (!image) return;
  const t = bannerTextFields(formData);
  db.prepare(
    "INSERT INTO banners (image, title, subtitle, font, color, subtitle_color, title_size, subtitle_size, pos_x, pos_y) VALUES (?,?,?,?,?,?,?,?,?,?)"
  ).run(image, t.title, t.subtitle, t.font, t.color, t.subtitle_color, t.title_size, t.subtitle_size, t.pos_x, t.pos_y);
  revalidatePath("/");
  revalidatePath("/admin/banners");
}

export async function updateBanner(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  let image: string | null = null;
  try {
    image = await saveImage(formData.get("image") as File | null);
  } catch {}
  const prevBanner = db.prepare("SELECT image FROM banners WHERE id = ?").get(id) as
    | { image: string }
    | undefined;
  const t = bannerTextFields(formData);
  if (image) {
    db.prepare(
      "UPDATE banners SET image=?, title=?, subtitle=?, font=?, color=?, subtitle_color=?, title_size=?, subtitle_size=?, pos_x=?, pos_y=? WHERE id=?"
    ).run(image, t.title, t.subtitle, t.font, t.color, t.subtitle_color, t.title_size, t.subtitle_size, t.pos_x, t.pos_y, id);
  } else {
    db.prepare(
      "UPDATE banners SET title=?, subtitle=?, font=?, color=?, subtitle_color=?, title_size=?, subtitle_size=?, pos_x=?, pos_y=? WHERE id=?"
    ).run(t.title, t.subtitle, t.font, t.color, t.subtitle_color, t.title_size, t.subtitle_size, t.pos_x, t.pos_y, id);
  }
  if (image) deleteUploadIfUnused(prevBanner?.image);
  revalidatePath("/");
  revalidatePath("/admin/banners");
}

export async function deleteBanner(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  const prev = db.prepare("SELECT image FROM banners WHERE id = ?").get(id) as
    | { image: string }
    | undefined;
  db.prepare("DELETE FROM banners WHERE id = ?").run(id);
  deleteUploadIfUnused(prev?.image);
  revalidatePath("/");
  revalidatePath("/admin/banners");
}

/** uploads фолдероос DB-д ашиглагдахгүй болсон бүх файлыг устгана (1 цагийн доторхыг алгасна) */
export async function cleanupUploads(): Promise<{ message: string }> {
  await requireAdmin();
  let files: string[] = [];
  try {
    files = fs.readdirSync(UPLOADS_DIR);
  } catch {
    return { message: "uploads фолдер алга" };
  }

  // Ашиглагдаж буй бүх URL-ын багц
  const used = new Set<string>();
  for (const r of db.prepare("SELECT image, color_images FROM products").all() as {
    image: string;
    color_images: string;
  }[]) {
    used.add(r.image);
    for (const imgs of Object.values(parseColorImages(r.color_images))) imgs.forEach((u) => used.add(u));
  }
  for (const r of db.prepare("SELECT image FROM categories").all() as { image: string }[]) used.add(r.image);
  for (const r of db.prepare("SELECT image FROM banners").all() as { image: string }[]) used.add(r.image);
  for (const r of db.prepare("SELECT value FROM settings").all() as { value: string }[]) used.add(r.value);

  let count = 0;
  let bytes = 0;
  const now = Date.now();
  for (const f of files) {
    if (!/^[\w.-]+$/.test(f) || used.has(`/api/uploads/${f}`)) continue;
    const full = path.join(UPLOADS_DIR, f);
    try {
      const st = fs.statSync(full);
      // Дөнгөж орж ирж буй (хадгалагдаагүй байгаа) файлыг андуурч устгахгүй
      if (now - st.mtimeMs < 60 * 60 * 1000) continue;
      fs.unlinkSync(full);
      count++;
      bytes += st.size;
    } catch {}
  }
  return {
    message: count
      ? `🧹 ${count} файл устгаж, ${(bytes / 1024 / 1024).toFixed(1)}MB суллалаа`
      : "Илүүдэл файл алга — бүх зураг ашиглагдаж байна ✓",
  };
}

// ---------- Тохиргоо ----------
export async function saveSettings(formData: FormData) {
  await requireAdmin();
  const keys = [
    "store_name",
    "bank_name",
    "bank_account",
    "bank_holder",
    "phone",
    "wire_api_key",
    "wire_webhook_secret",
  ];
  const up = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );
  for (const k of keys) {
    const v = (formData.get(k) as string) ?? "";
    up.run(k, v.trim());
  }
  // Лого: шинэ файл оруулбал солино, "арилгах" чагттай бол хоослоно (хуучин файлыг устгана)
  const prevLogo = (db.prepare("SELECT value FROM settings WHERE key = 'store_logo'").get() as
    | { value: string }
    | undefined)?.value;
  if (formData.get("remove_logo")) {
    up.run("store_logo", "");
    deleteUploadIfUnused(prevLogo);
  } else {
    try {
      const logo = await saveImage(formData.get("logo") as File | null);
      if (logo) {
        up.run("store_logo", logo);
        deleteUploadIfUnused(prevLogo);
      }
    } catch {}
  }
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
}
