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
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image TEXT NOT NULL DEFAULT '/img/placeholder.svg',
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
  qty INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
`);

// ----- анхны өгөгдөл (seed) -----
const catCount = (db.prepare("SELECT COUNT(*) c FROM categories").get() as { c: number }).c;
if (catCount === 0) {
  const insCat = db.prepare("INSERT INTO categories (name, slug) VALUES (?, ?)");
  const cats: Record<string, number> = {};
  for (const [name, slug] of [
    ["Электрон бараа", "electronics"],
    ["Хувцас", "fashion"],
    ["Гэр ахуй", "home"],
    ["Гоо сайхан", "beauty"],
  ]) {
    cats[slug] = Number(insCat.run(name, slug).lastInsertRowid);
  }

  const insProd = db.prepare(
    "INSERT INTO products (name, description, price, stock, image, category_id) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const seed: [string, string, number, number, string, number][] = [
    ["Утасгүй чихэвч", "Bluetooth 5.3, идэвхтэй шуугиан дарагч, 30 цаг ажиллана.", 89000, 25, "/img/p1.svg", cats.electronics],
    ["Ухаалаг цаг", "Зүрхний цохилт, унтлага хэмжигч, 7 хоног цэнэг барина.", 159000, 15, "/img/p2.svg", cats.electronics],
    ["Зөөврийн цэнэглэгч 20000mAh", "Хурдан цэнэглэгч, 2 USB гаралттай.", 65000, 40, "/img/p3.svg", cats.electronics],
    ["Эрэгтэй цамц", "100% хөвөн, S-XXL хэмжээтэй.", 45000, 30, "/img/p4.svg", cats.fashion],
    ["Эмэгтэй малгай", "Өвлийн дулаан ноосон малгай.", 28000, 20, "/img/p5.svg", cats.fashion],
    ["Сүлжмэл цүнх", "Гар хийцийн, байгальд ээлтэй материал.", 52000, 12, "/img/p6.svg", cats.fashion],
    ["Кофе аппарат", "Эспрессо, капучино хийх боломжтой.", 245000, 8, "/img/p7.svg", cats.home],
    ["Агаар чийгшүүлэгч", "5л багтаамж, чимээгүй ажиллагаа.", 98000, 18, "/img/p8.svg", cats.home],
    ["LED ширээний гэрэл", "Гэрлийн 3 горимтой, USB цэнэглэдэг.", 35000, 35, "/img/p9.svg", cats.home],
    ["Арьс чийгшүүлэгч тос", "Бүх төрлийн арьсанд тохиромжтой, 50мл.", 42000, 50, "/img/p10.svg", cats.beauty],
    ["Үнэртэй ус 50мл", "Цэцгэн анхилуун үнэр, удаан тогтоно.", 120000, 10, "/img/p11.svg", cats.beauty],
    ["Шампунь бэлгийн сет", "Байгалийн гаралтай найрлагатай бэлгийн сет.", 56000, 22, "/img/p12.svg", cats.beauty],
  ];
  for (const p of seed) insProd.run(...p);
}

const setCount = (db.prepare("SELECT COUNT(*) c FROM settings").get() as { c: number }).c;
if (setCount === 0) {
  const ins = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  ins.run("store_name", "Миний Дэлгүүр");
  ins.run("bank_name", "Хаан банк");
  ins.run("bank_account", "5000000000");
  ins.run("bank_holder", "Дэлгүүрийн эзний нэр");
  ins.run("phone", "9911-2233");
}

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
  category_id: number | null;
  active: number;
  created_at: string;
  category_name?: string;
};

export type Category = { id: number; name: string; slug: string };

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
};
