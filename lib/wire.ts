/**
 * Wire (wire.mn / wirepayment.mn) — QPay-г багтаасан төлбөрийн платформ.
 * Сервер дээрх shop.env дотор WIRE_API_KEY, WIRE_WEBHOOK_SECRET-ийг бөглөөд
 * контейнерээ дахин асаахад идэвхжинэ. Webhook хаяг: /api/wire/callback
 * (wow-server-ийн ажиллаж буй холболтоос хуулбарласан бүтэц.)
 */
import { createHmac, timingSafeEqual } from "crypto";
import { getSettings } from "@/lib/db";

const WIRE_API = "https://api.wire.mn";

/** Түлхүүрүүд: 1-рт админ Тохиргоо (DB settings), 2-рт shop.env */
function wireKeys() {
  const s = getSettings();
  return {
    apiKey: (s.wire_api_key || process.env.WIRE_API_KEY || "").trim(),
    webhookSecret: (s.wire_webhook_secret || process.env.WIRE_WEBHOOK_SECRET || "").trim(),
  };
}

export function wireEnabled(): boolean {
  return !!wireKeys().apiKey;
}

function siteUrl(): string {
  return process.env.SITE_URL || "https://altvault.uk";
}

export type WirePayment = {
  intentId: string;
  qrImage: string; // base64 PNG (data: угтваргүй)
  qrText: string;
  urls: { name: string; link: string; logo: string }[];
};

/** PaymentIntent үүсгээд QPay operator руу confirm хийж QR-ийг буцаана */
export async function createWirePayment(orderCode: string, amount: number): Promise<WirePayment> {
  const headers = {
    Authorization: `Bearer ${wireKeys().apiKey}`,
    "Content-Type": "application/json",
  };
  const r1 = await fetch(`${WIRE_API}/v1/payment_intents`, {
    method: "POST",
    headers: { ...headers, "Idempotency-Key": `shop-${orderCode}-create` },
    body: JSON.stringify({
      amount,
      currency: "MNT",
      allowed_operators: ["qpay"],
      // Гүйлгээний утга — банкны хуулгад захиалгын код шууд харагдана
      description: `Altvault zahialga ${orderCode}`,
      metadata: { order_code: orderCode },
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r1.ok) throw new Error(`Wire intent алдаа: ${r1.status} ${(await r1.text()).slice(0, 200)}`);
  const intent = await r1.json();

  const r2 = await fetch(`${WIRE_API}/v1/payment_intents/${intent.id}/confirm`, {
    method: "POST",
    headers: { ...headers, "Idempotency-Key": `shop-${orderCode}-confirm` },
    body: JSON.stringify({ operator: "qpay", return_url: `${siteUrl()}/order/${orderCode}` }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r2.ok) throw new Error(`Wire confirm алдаа: ${r2.status} ${(await r2.text()).slice(0, 200)}`);
  const confirmed = await r2.json();

  const na = confirmed.next_action || {};
  let qrImage = "";
  let qrText = "";
  let urls: { name: string; link: string; logo: string }[] = [];
  if (na.type === "qr" && na.qr) {
    // image_url нь бүтэн data:image/png;base64,... тул угтварыг хасна
    qrImage = (na.qr.image_url || "").replace(/^data:image\/[a-z]+;base64,/, "");
    qrText = na.qr.text || "";
    urls = (na.qr.deeplinks || []).map((d: { name: string; link: string; logo?: string }) => ({
      name: d.name,
      link: d.link,
      logo: d.logo || "",
    }));
  }
  return { intentId: intent.id, qrImage, qrText, urls };
}

/** Intent төлөгдсөн эсэх ("succeeded" = төлөгдсөн) */
export async function wirePaid(intentId: string): Promise<boolean> {
  const r = await fetch(`${WIRE_API}/v1/payment_intents/${intentId}`, {
    headers: { Authorization: `Bearer ${wireKeys().apiKey}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) return false;
  const d = await r.json();
  return d.status === "succeeded";
}

/**
 * Webhook гарын үсэг шалгах. Header: Wirepayment-Signature: t=<unix>,v1=<hex>
 * expected = HMAC_SHA256(secret, t + "." + rawBody); now - t < 300с.
 */
export function wireVerifySignature(sigHeader: string | null, rawBody: string): boolean {
  const secret = wireKeys().webhookSecret;
  if (!secret || !sigHeader) return false;
  const parts: Record<string, string> = {};
  for (const kv of sigHeader.split(",")) {
    const i = kv.indexOf("=");
    if (i > 0) parts[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
  }
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const payload = `${t}.${rawBody}`;
  // whsec_ бүтэн ба угтваргүй — аль аль нь туршиж тааруулна
  for (const key of [secret, secret.replace(/^whsec_/, "")]) {
    const expected = createHmac("sha256", key).update(payload).digest("hex");
    try {
      if (timingSafeEqual(Buffer.from(expected), Buffer.from(v1))) return true;
    } catch {}
  }
  return false;
}
