import db from "@/lib/db";
import { tugrug } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const stats = {
    pending: (db.prepare("SELECT COUNT(*) c FROM orders WHERE status='pending'").get() as { c: number }).c,
    paid: (db.prepare("SELECT COUNT(*) c FROM orders WHERE status='paid'").get() as { c: number }).c,
    products: (db.prepare("SELECT COUNT(*) c FROM products WHERE active=1").get() as { c: number }).c,
    revenue: (
      db.prepare("SELECT COALESCE(SUM(total),0) s FROM orders WHERE status IN ('paid','delivered')").get() as { s: number }
    ).s,
    lowStock: (db.prepare("SELECT COUNT(*) c FROM products WHERE active=1 AND stock <= 3").get() as { c: number }).c,
  };

  const cards = [
    { label: "Хүлээгдэж буй захиалга", value: stats.pending, href: "/admin/orders?status=pending", accent: "text-amber-600" },
    { label: "Төлөгдсөн захиалга", value: stats.paid, href: "/admin/orders?status=paid", accent: "text-green-600" },
    { label: "Нийт орлого", value: tugrug(stats.revenue), href: "/admin/orders", accent: "text-indigo-600" },
    { label: "Идэвхтэй бараа", value: stats.products, href: "/admin/products", accent: "text-slate-800" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold mb-5">Хянах самбар</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition"
          >
            <div className="text-sm text-slate-500">{c.label}</div>
            <div className={`text-2xl font-bold mt-1 ${c.accent}`}>{c.value}</div>
          </Link>
        ))}
      </div>
      {stats.lowStock > 0 && (
        <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          ⚠️ {stats.lowStock} барааны үлдэгдэл 3 ба түүнээс бага байна.{" "}
          <Link href="/admin/products" className="underline">
            Бараанууд харах
          </Link>
        </div>
      )}
    </div>
  );
}
