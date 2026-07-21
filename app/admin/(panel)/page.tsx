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
      db.prepare("SELECT COALESCE(SUM(total),0) s FROM orders WHERE status IN ('paid','ordered','in_transit','at_warehouse','delivering','delivered')").get() as { s: number }
    ).s,
  };

  const cards = [
    { label: "Хүлээгдэж буй захиалга", value: stats.pending, href: "/admin/orders?status=pending", accent: "text-amber-400" },
    { label: "Төлөгдсөн захиалга", value: stats.paid, href: "/admin/orders?status=paid", accent: "text-lime-400" },
    { label: "Нийт орлого", value: tugrug(stats.revenue), href: "/admin/orders", accent: "text-lime-400" },
    { label: "Идэвхтэй бараа", value: stats.products, href: "/admin/products", accent: "text-zinc-100" },
  ];

  return (
    <div>
      <h1 className="font-display mb-5 text-xl font-extrabold uppercase">Хянах самбар</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-lime-400/40"
          >
            <div className="text-sm text-zinc-500">{c.label}</div>
            <div className={`mt-1 text-2xl font-bold ${c.accent}`}>{c.value}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
