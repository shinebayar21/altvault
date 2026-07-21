import { NextRequest, NextResponse } from "next/server";
import db, { Order } from "@/lib/db";
import { checkPayment, qpayEnabled } from "@/lib/qpay";
import { wireEnabled, wirePaid } from "@/lib/wire";
import { PAID_STATUSES } from "@/lib/format";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const order = db.prepare("SELECT * FROM orders WHERE code = ?").get(code.toUpperCase()) as
    | Order
    | undefined;
  if (!order) return NextResponse.json({ error: "Захиалга олдсонгүй" }, { status: 404 });

  if (PAID_STATUSES.includes(order.status)) return NextResponse.json({ paid: true });

  if (order.payment_method === "qpay" && order.qpay_invoice_id) {
    let paid = false;
    if (order.pay_provider === "wire" && wireEnabled()) {
      paid = await wirePaid(order.qpay_invoice_id);
    } else if (qpayEnabled()) {
      paid = await checkPayment(order.qpay_invoice_id);
    }
    if (paid) {
      db.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").run(order.id);
      return NextResponse.json({ paid: true });
    }
  }
  return NextResponse.json({ paid: false });
}
