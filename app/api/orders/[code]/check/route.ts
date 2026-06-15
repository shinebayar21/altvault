import { NextRequest, NextResponse } from "next/server";
import db, { Order } from "@/lib/db";
import { checkPayment, qpayEnabled } from "@/lib/qpay";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const order = db.prepare("SELECT * FROM orders WHERE code = ?").get(code.toUpperCase()) as
    | Order
    | undefined;
  if (!order) return NextResponse.json({ error: "Захиалга олдсонгүй" }, { status: 404 });

  if (order.status === "paid" || order.status === "delivered")
    return NextResponse.json({ paid: true });

  if (order.payment_method === "qpay" && order.qpay_invoice_id && qpayEnabled()) {
    const paid = await checkPayment(order.qpay_invoice_id);
    if (paid) {
      db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").run(order.id);
      return NextResponse.json({ paid: true });
    }
  }
  return NextResponse.json({ paid: false });
}
