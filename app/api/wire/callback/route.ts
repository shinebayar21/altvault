import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { wireVerifySignature } from "@/lib/wire";

/**
 * Wire webhook — төлбөр баталгаажихад Wire эндээс дуудна (HMAC-SHA256 шалгана).
 * Wire dashboard дээр бүртгэх хаяг: https://altvault.uk/api/wire/callback
 */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    const sig =
      req.headers.get("wirepayment-signature") || req.headers.get("wire-payment-signature");
    const valid = wireVerifySignature(sig, raw);

    let event: {
      type?: string;
      data?: { object?: Record<string, unknown> } & Record<string, unknown>;
    } = {};
    try {
      event = JSON.parse(raw);
    } catch {}

    // Баталгаажуулах ping — зөвхөн хүртээмж шалгана, 2xx буцаана.
    // (signature таарсан эсэх нь лог-д — secret зөв эсэхийг мэдэхэд тус болно)
    if (event.type === "endpoint.verification") {
      console.log("WIRE verification ping — signature valid:", valid);
      return new NextResponse("ok");
    }

    // Жинхэнэ event — signature заавал зөв байх ёстой (мөнгө тул)
    if (!valid) {
      console.warn("WIRE bad signature for event:", event.type);
      return new NextResponse("bad signature", { status: 400 });
    }

    const data = (event.data?.object || event.data || {}) as {
      status?: string;
      metadata?: { order_code?: string };
    };
    const orderCode = data.metadata?.order_code;
    if (orderCode && (event.type === "payment_intent.succeeded" || data.status === "succeeded")) {
      // pending үед л paid болгоно — давхар боловсруулалтаас хамгаална
      db.prepare("UPDATE orders SET status = 'paid' WHERE code = ? AND status = 'pending'").run(
        String(orderCode).toUpperCase()
      );
    }
    return new NextResponse("ok");
  } catch (err) {
    console.error("wire-callback error:", err);
    return new NextResponse("error", { status: 500 });
  }
}
