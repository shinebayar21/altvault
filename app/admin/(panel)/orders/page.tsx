import db, { Order, OrderItem } from "@/lib/db";
import { tugrug, mnDateTime, STATUS_LABEL, STATUS_COLOR } from "@/lib/format";
import { setOrderStatus } from "@/lib/actions";
import OrderStatusSelect from "@/components/OrderStatusSelect";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string; phone?: string }>;
}) {
  const { status, from, to, phone } = await searchParams;
  const dateOk = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
  const fromOk = dateOk(from);
  const toOk = dateOk(to);
  const phoneDigits = (phone || "").replace(/\D/g, "");

  let sql = "SELECT * FROM orders WHERE 1=1";
  const params: string[] = [];
  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }
  // created_at нь UTC тул Монголын огноо (+8h) руу хөрвүүлж харьцуулна
  if (fromOk) {
    sql += " AND date(created_at, '+8 hours') >= ?";
    params.push(fromOk);
  }
  if (toOk) {
    sql += " AND date(created_at, '+8 hours') <= ?";
    params.push(toOk);
  }
  if (phoneDigits) {
    sql +=
      " AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'+',''),'(',''),')','') LIKE ?";
    params.push(`%${phoneDigits}%`);
  }
  sql += " ORDER BY created_at DESC LIMIT 200";
  const orders = db.prepare(sql).all(...params) as Order[];

  // таб солиход шүүлтүүдээ хадгалж үлдэх query string
  const qs = (statusKey: string) => {
    const p = new URLSearchParams();
    if (statusKey) p.set("status", statusKey);
    if (fromOk) p.set("from", fromOk);
    if (toOk) p.set("to", toOk);
    if (phone) p.set("phone", phone);
    const s = p.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };
  // Барааны зургийг хамт авна (бараа устсан бол NULL — зураггүй харагдана)
  const itemsStmt = db.prepare(
    `SELECT oi.*, p.image AS product_image FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`
  );

  const tabs = [
    { key: "", label: "Бүгд" },
    { key: "pending", label: "Хүлээгдэж буй" },
    { key: "paid", label: "Төлөгдсөн" },
    { key: "delivering", label: "Хүргэлтэнд" },
    { key: "delivered", label: "Хүргэгдсэн" },
    { key: "cancelled", label: "Цуцлагдсан" },
  ];

  return (
    <div>
      <h1 className="font-display mb-4 text-xl font-extrabold uppercase">Захиалгууд</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={qs(t.key)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
              (status || "") === t.key
                ? "border-lime-400 bg-lime-400 text-zinc-950"
                : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <form
        action="/admin/orders"
        className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-3"
      >
        {status && <input type="hidden" name="status" value={status} />}
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          Огноо
          <input
            type="date"
            name="from"
            defaultValue={fromOk}
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 transition focus:border-lime-400 focus:outline-none [color-scheme:dark]"
          />
          —
          <input
            type="date"
            name="to"
            defaultValue={toOk}
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 transition focus:border-lime-400 focus:outline-none [color-scheme:dark]"
          />
        </label>
        <label className="flex flex-1 items-center gap-2 text-xs text-zinc-400">
          Утас
          <input
            name="phone"
            defaultValue={phone || ""}
            placeholder="Утасны дугаараар хайх..."
            className="w-full max-w-56 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 transition focus:border-lime-400 focus:outline-none"
          />
        </label>
        <button className="rounded-xl bg-zinc-100 px-4 py-1.5 text-sm font-semibold text-zinc-950 transition hover:bg-lime-400">
          Шүүх
        </button>
        {(fromOk || toOk || phoneDigits) && (
          <Link
            href={status ? `/admin/orders?status=${status}` : "/admin/orders"}
            className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
          >
            ✕ Цэвэрлэх
          </Link>
        )}
        <span className="ml-auto text-xs text-zinc-500">{orders.length} захиалга</span>
      </form>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 py-10 text-center text-zinc-500">
          Захиалга алга
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const items = itemsStmt.all(o.id) as (OrderItem & { product_image: string | null })[];
            return (
              <div key={o.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{o.code}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {o.payment_method === "qpay" ? "QPay" : "Данс"}
                    </span>
                  </div>
                  <span className="text-sm text-zinc-500">{mnDateTime(o.created_at)}</span>
                </div>
                <div className="mt-2 text-sm text-zinc-300">
                  <span className="font-medium">{o.customer_name}</span> · {o.phone} · {o.address}
                  {o.note && <span className="text-zinc-500"> · 📝 {o.note}</span>}
                </div>
                <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
                  {items.map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center gap-3 border-b border-zinc-800/60 px-3 py-2 last:border-b-0"
                    >
                      {i.product_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={i.product_image}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-lg bg-zinc-800 object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-600">
                          👟
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-zinc-200">
                          {i.product_name}
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-1.5 text-xs">
                          {i.size && (
                            <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
                              Размер: {i.size}
                            </span>
                          )}
                          {i.color && (
                            <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
                              Өнгө: {i.color}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-sm">
                        <div className="text-xs text-zinc-500">
                          {tugrug(i.price)} × {i.qty}ш
                        </div>
                        <div className="font-semibold text-zinc-200">{tugrug(i.price * i.qty)}</div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between bg-zinc-900/80 px-3 py-2 text-sm">
                    <span className="text-zinc-400">
                      Нийт {items.reduce((s, i) => s + i.qty, 0)}ш бараа
                    </span>
                    <span className="font-bold text-lime-400">{tugrug(o.total)}</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {o.status === "pending" && (
                    <form action={setOrderStatus.bind(null, o.id, "paid")}>
                      <button className="rounded-xl bg-lime-400 px-4 py-1.5 text-sm font-bold text-zinc-950 transition hover:bg-lime-300">
                        ✓ Төлбөр баталгаажуулах
                      </button>
                    </form>
                  )}
                  {o.status === "paid" && (
                    <form action={setOrderStatus.bind(null, o.id, "delivering")}>
                      <button className="rounded-xl bg-violet-500 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-violet-400">
                        🚚 Хүргэлтэнд гаргах
                      </button>
                    </form>
                  )}
                  {o.status === "delivering" && (
                    <form action={setOrderStatus.bind(null, o.id, "delivered")}>
                      <button className="rounded-xl bg-sky-500 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-sky-400">
                        ✅ Хүргэгдсэн болгох
                      </button>
                    </form>
                  )}
                  {(o.status === "pending" || o.status === "paid") && (
                    <form action={setOrderStatus.bind(null, o.id, "cancelled")}>
                      <button className="rounded-xl border border-red-400/40 px-4 py-1.5 text-sm font-semibold text-red-400 transition hover:bg-red-400/10">
                        Цуцлах
                      </button>
                    </form>
                  )}
                  {o.status === "cancelled" && (
                    <form action={setOrderStatus.bind(null, o.id, "pending")}>
                      <button className="rounded-xl border border-zinc-700 px-4 py-1.5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800">
                        Сэргээх
                      </button>
                    </form>
                  )}
                  <OrderStatusSelect orderId={o.id} status={o.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
