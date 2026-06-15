import db, { Order, OrderItem } from "@/lib/db";
import { tugrug, STATUS_LABEL, STATUS_COLOR } from "@/lib/format";
import { setOrderStatus } from "@/lib/actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  let sql = "SELECT * FROM orders";
  const params: string[] = [];
  if (status) {
    sql += " WHERE status = ?";
    params.push(status);
  }
  sql += " ORDER BY created_at DESC LIMIT 200";
  const orders = db.prepare(sql).all(...params) as Order[];
  const itemsStmt = db.prepare("SELECT * FROM order_items WHERE order_id = ?");

  const tabs = [
    { key: "", label: "Бүгд" },
    { key: "pending", label: "Хүлээгдэж буй" },
    { key: "paid", label: "Төлөгдсөн" },
    { key: "delivered", label: "Хүргэгдсэн" },
    { key: "cancelled", label: "Цуцлагдсан" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Захиалгууд</h1>
      <div className="flex gap-2 flex-wrap mb-4">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/admin/orders?status=${t.key}` : "/admin/orders"}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              (status || "") === t.key
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white border-slate-300"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-slate-500 py-10 text-center bg-white rounded-xl border border-slate-200">
          Захиалга алга
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const items = itemsStmt.all(o.id) as OrderItem[];
            return (
              <div key={o.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{o.code}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_COLOR[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                    <span className="text-xs text-slate-400">
                      {o.payment_method === "qpay" ? "QPay" : "Данс"}
                    </span>
                  </div>
                  <span className="text-sm text-slate-500">{o.created_at}</span>
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">{o.customer_name}</span> · {o.phone} · {o.address}
                  {o.note && <span className="text-slate-500"> · 📝 {o.note}</span>}
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  {items.map((i) => `${i.product_name}×${i.qty}`).join(", ")} —{" "}
                  <span className="font-bold text-indigo-600">{tugrug(o.total)}</span>
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {o.status === "pending" && (
                    <form action={setOrderStatus.bind(null, o.id, "paid")}>
                      <button className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700">
                        ✓ Төлбөр баталгаажуулах
                      </button>
                    </form>
                  )}
                  {o.status === "paid" && (
                    <form action={setOrderStatus.bind(null, o.id, "delivered")}>
                      <button className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700">
                        🚚 Хүргэгдсэн болгох
                      </button>
                    </form>
                  )}
                  {(o.status === "pending" || o.status === "paid") && (
                    <form action={setOrderStatus.bind(null, o.id, "cancelled")}>
                      <button className="text-sm bg-white border border-red-300 text-red-600 px-4 py-1.5 rounded-lg hover:bg-red-50">
                        Цуцлах
                      </button>
                    </form>
                  )}
                  {o.status === "cancelled" && (
                    <form action={setOrderStatus.bind(null, o.id, "pending")}>
                      <button className="text-sm bg-white border border-slate-300 px-4 py-1.5 rounded-lg hover:bg-slate-50">
                        Сэргээх
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
