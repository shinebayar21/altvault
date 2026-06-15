import { NextRequest, NextResponse } from "next/server";
import db, { Product } from "@/lib/db";
import { qpayEnabled, createInvoice } from "@/lib/qpay";
import { randomBytes } from "crypto";

function genCode(): string {
  return "SH" + randomBytes(3).toString("hex").toUpperCase();
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { customer_name, phone, address, note, payment_method, items } = body as {
    customer_name: string;
    phone: string;
    address: string;
    note?: string;
    payment_method: string;
    items: { id: number; qty: number }[];
  };

  if (!customer_name?.trim() || !phone?.trim() || !address?.trim())
    return NextResponse.json({ error: "Нэр, утас, хаягаа бөглөнө үү" }, { status: 400 });
  if (!Array.isArray(items) || items.length === 0)
    return NextResponse.json({ error: "Сагс хоосон байна" }, { status: 400 });

  // Барааг сервер талд шалгаж, үнийг DB-ээс авна
  const getProd = db.prepare("SELECT * FROM products WHERE id = ? AND active = 1");
  const lines: { product: Product; qty: number }[] = [];
  for (const it of items) {
    const p = getProd.get(it.id) as Product | undefined;
    if (!p) return NextResponse.json({ error: "Бараа олдсонгүй" }, { status: 400 });
    const qty = Math.floor(Number(it.qty));
    if (!qty || qty < 1)
      return NextResponse.json({ error: "Тоо ширхэг буруу байна" }, { status: 400 });
    if (qty > p.stock)
      return NextResponse.json(
        { error: `"${p.name}" барааны үлдэгдэл хүрэлцэхгүй (${p.stock} ширхэг үлдсэн)` },
        { status: 400 }
      );
    lines.push({ product: p, qty });
  }

  const total = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const method = payment_method === "qpay" && qpayEnabled() ? "qpay" : "bank";

  let code = genCode();
  while (db.prepare("SELECT 1 FROM orders WHERE code = ?").get(code)) code = genCode();

  const createOrder = db.transaction(() => {
    const r = db
      .prepare(
        `INSERT INTO orders (code, customer_name, phone, address, note, total, payment_method)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(code, customer_name.trim(), phone.trim(), address.trim(), (note || "").trim(), total, method);
    const orderId = Number(r.lastInsertRowid);
    const insItem = db.prepare(
      "INSERT INTO order_items (order_id, product_id, product_name, price, qty) VALUES (?, ?, ?, ?, ?)"
    );
    const decStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
    for (const l of lines) {
      insItem.run(orderId, l.product.id, l.product.name, l.product.price, l.qty);
      decStock.run(l.qty, l.product.id);
    }
    return orderId;
  });
  createOrder();

  // QPay идэвхтэй бол нэхэмжлэх үүсгэнэ
  if (method === "qpay") {
    try {
      const inv = await createInvoice(code, total, `Захиалга ${code}`);
      const payUrl = inv.urls?.find((u) => u.name?.toLowerCase().includes("qpay"))?.link || "";
      db.prepare("UPDATE orders SET qpay_invoice_id = ?, qpay_qr = ?, qpay_url = ? WHERE code = ?").run(
        inv.invoice_id,
        inv.qr_image || "",
        payUrl,
        code
      );
    } catch (e) {
      console.error("QPay invoice error:", e);
      // QPay амжилтгүй бол дансаар төлөх горимд шилжүүлнэ
      db.prepare("UPDATE orders SET payment_method = 'bank' WHERE code = ?").run(code);
    }
  }

  return NextResponse.json({ code });
}
