import db, { Order, OrderItem, getSettings } from "@/lib/db";
import { tugrug, STATUS_LABEL, STATUS_COLOR } from "@/lib/format";
import { notFound } from "next/navigation";
import Link from "next/link";
import CheckPaymentButton from "@/components/CheckPaymentButton";
import CartClearOnPaid from "@/components/CartClearOnPaid";

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

  const isPaid = ["paid", "delivering", "delivered"].includes(order.status);

  // qpay_url: шинэ формат нь JSON массив [{name,link,logo}], хуучин нь ганц deeplink мөр
  let payLinks: { name: string; link: string; logo?: string }[] = [];
  if (order.qpay_url) {
    if (order.qpay_url.startsWith("[")) {
      try {
        payLinks = JSON.parse(order.qpay_url);
      } catch {}
    } else {
      payLinks = [{ name: "Утаснаасаа төлөх", link: order.qpay_url }];
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <CartClearOnPaid code={order.code} paid={isPaid} />
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-display text-xl font-extrabold uppercase">
            Захиалга: <span className="text-lime-400">{order.code}</span>
          </h1>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_COLOR[order.status]}`}>
            {STATUS_LABEL[order.status]}
          </span>
        </div>

        <div className="mt-5 divide-y divide-zinc-800 border-y border-zinc-800">
          {items.map((i) => (
            <div key={i.id} className="flex justify-between py-2.5 text-sm">
              <span className="text-zinc-300">
                {i.product_name}
                {(i.size || i.color) && (
                  <span className="text-zinc-500">
                    {" "}
                    ({[i.size && `размер ${i.size}`, i.color].filter(Boolean).join(", ")})
                  </span>
                )}{" "}
                × {i.qty}
              </span>
              <span>{tugrug(i.price * i.qty)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between py-3 font-bold">
          <span>Нийт дүн</span>
          <span className="text-lime-400">{tugrug(order.total)}</span>
        </div>

        {order.status === "pending" && (
          <div className="mt-4 rounded-2xl border border-lime-400/20 bg-lime-400/5 p-5">
            {order.payment_method === "qpay" && order.qpay_qr ? (
              <div className="text-center">
                <div className="mb-3 font-semibold">📱 QPay-ээр төлөх</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${order.qpay_qr}`}
                  alt="QPay QR"
                  className="mx-auto h-52 w-52 rounded-xl bg-white p-2"
                />
                <p className="mt-3 text-sm text-zinc-400">
                  Банкны аппликейшнээрээ QR кодыг уншуулж төлнө үү.
                </p>
                {payLinks.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 text-xs text-zinc-500">
                      📲 Утсан дээрээс үзэж байгаа бол банкны аппаа сонгоод дарна уу:
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {payLinks.map((u) => (
                        <a
                          key={u.name}
                          href={u.link}
                          className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-lime-400 hover:text-lime-400"
                        >
                          {u.logo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u.logo} alt="" className="h-5 w-5 rounded-md object-contain" />
                          )}
                          {u.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-4">
                  <CheckPaymentButton code={order.code} />
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-3 font-semibold">🏦 Дансаар шилжүүлэх заавар</div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="w-36 py-1 text-zinc-500">Банк:</td>
                      <td className="font-medium">{s.bank_name}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-zinc-500">Дансны дугаар:</td>
                      <td className="font-medium">{s.bank_account}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-zinc-500">Хүлээн авагч:</td>
                      <td className="font-medium">{s.bank_holder}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-zinc-500">Шилжүүлэх дүн:</td>
                      <td className="font-bold text-lime-400">{tugrug(order.total)}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-zinc-500">Гүйлгээний утга:</td>
                      <td className="font-bold text-orange-400">{order.code}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="mt-3 text-xs text-zinc-500">
                  ⚠️ Гүйлгээний утга дээр захиалгын кодоо заавал бичнэ үү. Төлбөр орж ирмэгц бид
                  захиалгыг баталгаажуулна.
                </p>
              </div>
            )}
          </div>
        )}

        {order.status === "paid" && (
          <div className="mt-4 rounded-2xl border border-lime-400/30 bg-lime-400/10 p-4 text-sm text-lime-300">
            ✅ Төлбөр баталгаажсан. Бид таны захиалгыг бэлдэж, хүргэлтэд гаргана.
          </div>
        )}

        <div className="mt-5 text-sm text-zinc-500">Холбоо барих: {s.phone}</div>
      </div>
      <div className="mt-4 text-center">
        <Link href="/" className="text-sm text-lime-400 hover:underline">
          ← Дэлгүүр рүү буцах
        </Link>
      </div>
    </div>
  );
}
