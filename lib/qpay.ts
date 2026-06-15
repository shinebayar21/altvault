/**
 * QPay v2 API integration.
 * QPay-тэй мерчант гэрээ хийсний дараа .env.local дотор
 * QPAY_USERNAME, QPAY_PASSWORD, QPAY_INVOICE_CODE-г бөглөхөд идэвхжинэ.
 * Баримт: https://developer.qpay.mn
 */

const QPAY_BASE = "https://merchant.qpay.mn/v2";

export function qpayEnabled(): boolean {
  return !!(process.env.QPAY_USERNAME && process.env.QPAY_PASSWORD && process.env.QPAY_INVOICE_CODE);
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.token;
  const basic = Buffer.from(`${process.env.QPAY_USERNAME}:${process.env.QPAY_PASSWORD}`).toString("base64");
  const res = await fetch(`${QPAY_BASE}/auth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!res.ok) throw new Error(`QPay auth алдаа: ${res.status}`);
  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return cachedToken.token;
}

export type QPayInvoice = {
  invoice_id: string;
  qr_text: string;
  qr_image: string; // base64 PNG
  urls: { name: string; description: string; link: string }[];
};

export async function createInvoice(orderCode: string, amount: number, description: string): Promise<QPayInvoice> {
  const token = await getToken();
  const callbackBase = process.env.QPAY_CALLBACK_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${QPAY_BASE}/invoice`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      invoice_code: process.env.QPAY_INVOICE_CODE,
      sender_invoice_no: orderCode,
      invoice_receiver_code: "terminal",
      invoice_description: description,
      amount,
      callback_url: `${callbackBase}/api/qpay/callback?order=${orderCode}`,
    }),
  });
  if (!res.ok) throw new Error(`QPay invoice алдаа: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Нэхэмжлэх төлөгдсөн эсэхийг шалгана */
export async function checkPayment(invoiceId: string): Promise<boolean> {
  const token = await getToken();
  const res = await fetch(`${QPAY_BASE}/payment/check`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      object_type: "INVOICE",
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 100 },
    }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return (data.rows ?? []).some((r: { payment_status: string }) => r.payment_status === "PAID");
}
