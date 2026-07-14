import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "shop.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  image TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image TEXT NOT NULL DEFAULT '/img/placeholder.svg',
  sizes TEXT NOT NULL DEFAULT '',
  colors TEXT NOT NULL DEFAULT '',
  variants_out TEXT NOT NULL DEFAULT '[]',
  color_images TEXT NOT NULL DEFAULT '{}',
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  total INTEGER NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'bank',
  status TEXT NOT NULL DEFAULT 'pending',
  qpay_invoice_id TEXT,
  qpay_qr TEXT,
  qpay_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  qty INTEGER NOT NULL,
  size TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  font TEXT NOT NULL DEFAULT 'display',
  color TEXT NOT NULL DEFAULT '#ffffff',
  subtitle_color TEXT NOT NULL DEFAULT '#ffffff',
  title_size INTEGER NOT NULL DEFAULT 48,
  subtitle_size INTEGER NOT NULL DEFAULT 18,
  pos_x TEXT NOT NULL DEFAULT 'left',
  pos_y TEXT NOT NULL DEFAULT 'center',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// ----- migration: хуучин DB-д шинэ багана нэмэх -----
function ensureColumn(table: string, column: string, ddl: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

// next build олон worker-оор зэрэг import хийдэг тул migration+seed-ийг
// BEGIN IMMEDIATE транзакцаар түгжинэ — эс бөгөөс хоёр процесс зэрэг seed хийж
// UNIQUE constraint алдаа өгдөг (Docker build дээр тохиолдсон).
const initDb = db.transaction(() => {
ensureColumn("products", "sizes", "sizes TEXT NOT NULL DEFAULT ''");
ensureColumn("products", "colors", "colors TEXT NOT NULL DEFAULT ''");
// дууссан өнгө×размер хослолуудын JSON массив: ["Цагаан|41","Хар|42"]
ensureColumn("products", "variants_out", "variants_out TEXT NOT NULL DEFAULT '[]'");
// өнгө бүрийн зураг: {"Хар":"/api/uploads/xx.jpg"}
ensureColumn("products", "color_images", "color_images TEXT NOT NULL DEFAULT '{}'");
ensureColumn("categories", "image", "image TEXT NOT NULL DEFAULT ''");
// реклам зурган дээрх текст, фонт, өнгө
ensureColumn("banners", "title", "title TEXT NOT NULL DEFAULT ''");
ensureColumn("banners", "subtitle", "subtitle TEXT NOT NULL DEFAULT ''");
ensureColumn("banners", "font", "font TEXT NOT NULL DEFAULT 'display'");
ensureColumn("banners", "color", "color TEXT NOT NULL DEFAULT '#ffffff'");
ensureColumn("banners", "title_size", "title_size INTEGER NOT NULL DEFAULT 48");
ensureColumn("banners", "subtitle_size", "subtitle_size INTEGER NOT NULL DEFAULT 18");
ensureColumn("banners", "pos_x", "pos_x TEXT NOT NULL DEFAULT 'left'");
ensureColumn("banners", "pos_y", "pos_y TEXT NOT NULL DEFAULT 'center'");
// тайлбарын өнгө тусдаа болохоос өмнөх рекламд гарчгийн өнгийг нь хуулна
{
  const cols = db.prepare("PRAGMA table_info(banners)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "subtitle_color")) {
    db.exec("ALTER TABLE banners ADD COLUMN subtitle_color TEXT NOT NULL DEFAULT '#ffffff'");
    db.exec("UPDATE banners SET subtitle_color = color");
  }
}

// хуучин colors_out (өнгө бүхэлдээ дууссан) байвал variants_out руу хөрвүүлнэ
{
  const cols = db.prepare("PRAGMA table_info(products)").all() as { name: string }[];
  if (cols.some((c) => c.name === "colors_out")) {
    const rows = db
      .prepare("SELECT id, sizes, colors_out FROM products WHERE colors_out != '' AND variants_out = '[]'")
      .all() as { id: number; sizes: string; colors_out: string }[];
    const upd = db.prepare("UPDATE products SET variants_out = ?, colors_out = '' WHERE id = ?");
    for (const r of rows) {
      const sizes = r.sizes.split(",").map((s) => s.trim()).filter(Boolean);
      const outColors = r.colors_out.split(",").map((s) => s.trim()).filter(Boolean);
      const keys: string[] = [];
      for (const c of outColors) {
        if (sizes.length === 0) keys.push(`${c}|`);
        else for (const s of sizes) keys.push(`${c}|${s}`);
      }
      upd.run(JSON.stringify(keys), r.id);
    }
  }
}
ensureColumn("order_items", "size", "size TEXT NOT NULL DEFAULT ''");
ensureColumn("order_items", "color", "color TEXT NOT NULL DEFAULT ''");

// ----- анхны өгөгдөл (seed) -----
const catCount = (db.prepare("SELECT COUNT(*) c FROM categories").get() as { c: number }).c;
if (catCount === 0) {
  const insCat = db.prepare("INSERT INTO categories (name, slug) VALUES (?, ?)");
  const cats: Record<string, number> = {};
  for (const [name, slug] of [
    ["Эрэгтэй", "men"],
    ["Эмэгтэй", "women"],
    ["Спорт", "sport"],
    ["Lifestyle", "lifestyle"],
  ]) {
    cats[slug] = Number(insCat.run(name, slug).lastInsertRowid);
  }

  const insProd = db.prepare(
    "INSERT INTO products (name, description, price, stock, image, sizes, colors, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const MEN = "40,41,42,43,44,45";
  const WOMEN = "35,36,37,38,39,40";
  const ALL = "36,37,38,39,40,41,42,43,44";
  const seed: [string, string, number, number, string, string, string, number][] = [
    ["Air Runner Volt", "Хөнгөн, амьсгалдаг тор материалтай, өдөр тутмын өмсгөлд төгс street пүүз.", 189000, 24, "/img/s1.svg", MEN, "Хар,Цагаан,Volt", cats.men],
    ["Street Flow 90", "Ретро 90-ээд оны загвар, зузаан ултай, гудамжны стилийн од.", 219000, 18, "/img/s2.svg", MEN, "Хар,Улбар шар", cats.men],
    ["Cloud Step W", "Үүлэн дээр алхаж буй мэт зөөлөн ул, эмэгтэй хөлд зориулсан нарийн хийц.", 199000, 20, "/img/s3.svg", WOMEN, "Цагаан,Ягаан,Цэнхэр", cats.women],
    ["Pastel Kick", "Пастель өнгөний хослол, хавар зуны трэнд загвар.", 175000, 15, "/img/s4.svg", WOMEN, "Ягаан,Нил ягаан,Цагаан", cats.women],
    ["Marathon Pro", "Гүйлтийн мэргэжлийн пүүз — carbon plate, хамгийн хөнгөн жин.", 289000, 12, "/img/s5.svg", ALL, "Хар,Ногоон", cats.sport],
    ["Court Ace", "Сагсан бөмбөгийн өндөр түрийтэй, шагайг сайн тогтооно.", 245000, 10, "/img/s6.svg", MEN, "Хар,Цагаан,Шар", cats.sport],
    ["Gym Flex", "Фитнесс, кроссфитэд зориулсан тогтвортой өргөн ултай.", 165000, 22, "/img/s7.svg", ALL, "Хар,Саарал", cats.sport],
    ["Daily Classic", "Ямар ч хувцастай зохицох цэвэрхэн минимал загвар.", 149000, 30, "/img/s8.svg", ALL, "Цагаан,Хар,Хүрэн", cats.lifestyle],
    ["Retro Wave", "Ретро долгионы загвар, чанк ул — Gen Z-ийн сонголт.", 209000, 14, "/img/s9.svg", ALL, "Цагаан,Улбар шар,Цэнхэр", cats.lifestyle],
    ["Night Glow", "Харанхуйд гэрэлтдэг элементтэй, шөнийн амьдралын пүүз.", 232000, 8, "/img/s10.svg", MEN, "Хар,Volt", cats.lifestyle],
  ];
  for (const p of seed) insProd.run(...p);
}

const setCount = (db.prepare("SELECT COUNT(*) c FROM settings").get() as { c: number }).c;
if (setCount === 0) {
  const ins = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  ins.run("store_name", "KICKS.MN");
  ins.run("bank_name", "Хаан банк");
  ins.run("bank_account", "5000000000");
  ins.run("bank_holder", "Дэлгүүрийн эзний нэр");
  ins.run("phone", "9911-2233");
}
});
initDb.immediate();

export default db;

// ----- туслах функцууд -----
export function getSettings(): Record<string, string> {
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  sizes: string;
  colors: string;
  variants_out: string;
  color_images: string;
  category_id: number | null;
  active: number;
  created_at: string;
  category_name?: string;
};

export type Category = { id: number; name: string; slug: string; image: string };

export type Banner = {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  font: string;
  color: string;
  subtitle_color: string;
  title_size: number;
  subtitle_size: number;
  pos_x: string;
  pos_y: string;
  created_at: string;
};

export type Order = {
  id: number;
  code: string;
  customer_name: string;
  phone: string;
  address: string;
  note: string;
  total: number;
  payment_method: string;
  status: string;
  qpay_invoice_id: string | null;
  qpay_qr: string | null;
  qpay_url: string | null;
  created_at: string;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  price: number;
  qty: number;
  size: string;
  color: string;
};
