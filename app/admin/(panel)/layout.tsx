import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import AdminOrderWatch from "@/components/AdminOrderWatch";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="grid gap-6 md:grid-cols-[210px_1fr]">
      <aside className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900 p-4 md:sticky md:top-20">
        <div className="font-display mb-4 font-bold uppercase tracking-wide">
          ⚙️ Админ<span className="text-lime-400">.</span>
        </div>
        <nav className="space-y-1 text-sm">
          <Link
            href="/admin"
            className="block rounded-xl px-3 py-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-lime-400"
          >
            📊 Хянах самбар
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-lime-400"
          >
            📦 Захиалгууд
            <AdminOrderWatch />
          </Link>
          <Link
            href="/admin/products"
            className="block rounded-xl px-3 py-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-lime-400"
          >
            👟 Бараанууд
          </Link>
          <Link
            href="/admin/categories"
            className="block rounded-xl px-3 py-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-lime-400"
          >
            🏷️ Категориуд
          </Link>
          <Link
            href="/admin/banners"
            className="block rounded-xl px-3 py-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-lime-400"
          >
            🖼️ Реклам
          </Link>
          <Link
            href="/admin/settings"
            className="block rounded-xl px-3 py-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-lime-400"
          >
            🔧 Тохиргоо
          </Link>
        </nav>
        <form action={logoutAction} className="mt-4 border-t border-zinc-800 pt-3">
          <button className="px-3 text-sm text-red-400 transition hover:text-red-300">Гарах</button>
        </form>
      </aside>
      <div>{children}</div>
    </div>
  );
}
