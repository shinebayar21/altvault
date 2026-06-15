import { NextRequest, NextResponse } from "next/server";
import db, { Order } from "@/lib/db";
import { checkPayment, qpayEnabled } from "@/lib/qpay";

/** QPay төлбөр хийгдсэн үед энэ хаяг руу дуудлага хийдэг */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("order");
  if (!code) return NextResponse.json({ ok: false });

  const order = db.prepare("SELECT * FROM orders WHERE code = ?").get(code.toUpperCase()) as
    | Order
    | undefined;
  if (!order || !order.qpay_invoice_id || !qpayEnabled()) return NextResponse.json({ ok: false });

  // Callback-д шууд итгэхгүй — QPay-аас давхар шалгана
  const paid = await checkPayment(order.qpay_invoice_id);
  if (paid && order.status === "pending") {
    db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").run(order.id);
  }
  return NextResponse.json({ ok: true });
}

export const POST = GET;
