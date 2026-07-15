import { NextRequest, NextResponse } from "next/server";
import db, { Product } from "@/lib/db";
import { splitList, variantKey, parseVariantsOut, priceInfo } from "@/lib/format";
import { qpayEnabled, createInvoice } from "@/lib/qpay";
import { wireEnabled, createWirePayment } from "@/lib/wire";
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
    items: { id: number; qty: number; size?: string; color?: string }[];
  };

  if (!customer_name?.trim() || !phone?.trim() || !address?.trim())
    return NextResponse.json({ error: "Нэр, утас, хаягаа бөглөнө үү" }, { status: 400 });
  if (!Array.isArray(items) || items.length === 0)
    return NextResponse.json({ error: "Сагс хоосон байна" }, { status: 400 });

  // Барааг сервер талд шалгаж, үнийг DB-ээс авна
  const getProd = db.prepare("SELECT * FROM products WHERE id = ? AND active = 1");
  const lines: { product: Product; qty: number; size: string; color: string }[] = [];
  for (const it of items) {
    const p = getProd.get(it.id) as Product | undefined;
    if (!p) return NextResponse.json({ error: "Бараа олдсонгүй" }, { status: 400 });
    const qty = Math.floor(Number(it.qty));
    if (!qty || qty < 1)
      return NextResponse.json({ error: "Тоо ширхэг буруу байна" }, { status: 400 });
    const size = String(it.size || "").trim();
    const color = String(it.color || "").trim();
    const sizes = splitList(p.sizes);
    const colors = splitList(p.colors);
    const outSet = parseVariantsOut(p.variants_out);
    if (sizes.length > 0 && !sizes.includes(size))
      return NextResponse.json({ error: `"${p.name}" барааны размер сонгогдоогүй байна` }, { status: 400 });
    if (colors.length > 0 && !colors.includes(color))
      return NextResponse.json({ error: `"${p.name}" барааны өнгө сонгогдоогүй байна` }, { status: 400 });
    if ((colors.length > 0 || sizes.length > 0) && outSet.has(variantKey(color, size)))
      return NextResponse.json(
        {
          error: `"${p.name}" барааны ${[color, size && `${size} размер`].filter(Boolean).join(", ")} дууссан байна`,
        },
        { status: 400 }
      );
    lines.push({ product: p, qty, size, color });
  }

  // Хямдрал + өнгөний үнийг харгалзсан хүчинтэй үнэ (клиентийн үнийг үл ашиглана)
  const total = lines.reduce((s, l) => s + priceInfo(l.product, l.color).current * l.qty, 0);
  const method = payment_method === "qpay" && (wireEnabled() || qpayEnabled()) ? "qpay" : "bank";

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
      "INSERT INTO order_items (order_id, product_id, product_name, price, qty, size, color) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    // Үлдэгдэл тооцдоггүй тул stock-оос хасахгүй
    for (const l of lines) {
      insItem.run(orderId, l.product.id, l.product.name, priceInfo(l.product, l.color).current, l.qty, l.size, l.color);
    }
    return orderId;
  });
  createOrder();

  // QR төлбөр — 1-рт Wire (тохируулсан бол), эс бөгөөс QPay-direct
  if (method === "qpay") {
    try {
      // qpay_url-д банкны аппуудын deeplink-үүдийг JSON массиваар хадгална
      if (wireEnabled()) {
        const pay = await createWirePayment(code, total);
        db.prepare(
          "UPDATE orders SET qpay_invoice_id = ?, qpay_qr = ?, qpay_url = ?, pay_provider = 'wire' WHERE code = ?"
        ).run(pay.intentId, pay.qrImage, JSON.stringify(pay.urls), code);
      } else {
        const inv = await createInvoice(code, total, `Захиалга ${code}`);
        const urls = (inv.urls || []).map((u) => ({ name: u.name, link: u.link, logo: u.logo || "" }));
        db.prepare(
          "UPDATE orders SET qpay_invoice_id = ?, qpay_qr = ?, qpay_url = ?, pay_provider = 'qpay' WHERE code = ?"
        ).run(inv.invoice_id, inv.qr_image || "", JSON.stringify(urls), code);
      }
    } catch (e) {
      console.error("Payment invoice error:", e);
      // Төлбөрийн систем амжилтгүй бол дансаар төлөх горимд шилжүүлнэ
      db.prepare("UPDATE orders SET payment_method = 'bank' WHERE code = ?").run(code);
    }
  }

  return NextResponse.json({ code });
}
