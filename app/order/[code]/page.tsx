import db, { Order, OrderItem, getSettings } from "@/lib/db";
import { tugrug, STATUS_LABEL, STATUS_COLOR } from "@/lib/format";
import { notFound } from "next/navigation";
import Link from "next/link";
import CheckPaymentButton from "@/components/CheckPaymentButton";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const order = db.prepare("SELECT * FROM orders WHERE code = ?").get(code.toUpperCase()) as
    | Order
    | undefined;
  if (!order) notFound();

  const items = db
    .prepare("SELECT * FROM order_items WHERE order_id = ?")
    .all(order.id) as OrderItem[];
  const s = getSettings();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold">Захиалга: {order.code}</h1>
          <span className={`text-sm px-3 py-1 rounded-full ${STATUS_COLOR[order.status]}`}>
            {STATUS_LABEL[order.status]}
          </span>
        </div>
        <div className="mt-1 text-sm text-slate-500">{order.created_at}</div>

        <div className="mt-5 divide-y divide-slate-100 border-y border-slate-100">
          {items.map((i) => (
            <div key={i.id} className="flex justify-between py-2 text-sm">
              <span>
                {i.product_name} × {i.qty}
              </span>
              <span>{tugrug(i.price * i.qty)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between py-3 font-bold">
          <span>Нийт дүн</span>
          <span className="text-indigo-600">{tugrug(order.total)}</span>
        </div>

        {order.status === "pending" && (
          <div className="mt-4 rounded-xl bg-indigo-50 border border-indigo-100 p-5">
            {order.payment_method === "qpay" && order.qpay_qr ? (
              <div className="text-center">
                <div className="font-medium mb-3">📱 QPay-ээр төлөх</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${order.qpay_qr}`}
                  alt="QPay QR"
                  className="w-52 h-52 mx-auto rounded-lg bg-white p-2"
                />
                <p className="text-sm text-slate-600 mt-3">
                  Банкны аппликейшнээрээ QR кодыг уншуулж төлнө үү.
                </p>
                {order.qpay_url && (
                  <a
                    href={order.qpay_url}
                    className="inline-block mt-3 text-indigo-600 underline text-sm"
                  >
                    Утаснаасаа төлөх бол энд дарна уу
                  </a>
                )}
                <div className="mt-4">
                  <CheckPaymentButton code={order.code} />
                </div>
              </div>
            ) : (
              <div>
                <div className="font-medium mb-3">🏦 Дансаар шилжүүлэх заавар</div>
                <table className="text-sm w-full">
                  <tbody>
                    <tr>
                      <td className="py-1 text-slate-500 w-36">Банк:</td>
                      <td className="font-medium">{s.bank_name}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-500">Дансны дугаар:</td>
                      <td className="font-medium">{s.bank_account}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-500">Хүлээн авагч:</td>
                      <td className="font-medium">{s.bank_holder}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-500">Шилжүүлэх дүн:</td>
                      <td className="font-bold text-indigo-600">{tugrug(order.total)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-500">Гүйлгээний утга:</td>
                      <td className="font-bold text-red-600">
                        {order.code} {order.phone}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-xs text-slate-500 mt-3">
                  ⚠️ Гүйлгээний утга дээр захиалгын кодоо заавал бичнэ үү. Төлбөр орж ирмэгц бид
                  захиалгыг баталгаажуулна.
                </p>
              </div>
            )}
          </div>
        )}

        {order.status === "paid" && (
          <div className="mt-4 rounded-xl bg-green-50 border border-green-100 p-4 text-green-800 text-sm">
            ✅ Төлбөр баталгаажсан. Бид таны захиалгыг бэлдэж, хүргэлтэд гаргана.
          </div>
        )}

        <div className="mt-5 text-sm text-slate-500">
          Холбоо барих: {s.phone} · Хүргэлтийн хаяг: {order.address}
        </div>
      </div>
      <div className="mt-4 text-center">
        <Link href="/" className="text-indigo-600 text-sm hover:underline">
          ← Дэлгүүр рүү буцах
        </Link>
      </div>
    </div>
  );
}
