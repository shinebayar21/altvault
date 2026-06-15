import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="grid md:grid-cols-[200px_1fr] gap-6">
      <aside className="bg-white rounded-xl border border-slate-200 p-4 h-fit md:sticky md:top-20">
        <div className="font-bold text-indigo-600 mb-4">⚙️ Админ</div>
        <nav className="space-y-1 text-sm">
          <Link href="/admin" className="block px-3 py-2 rounded-lg hover:bg-slate-100">
            📊 Хянах самбар
          </Link>
          <Link href="/admin/orders" className="block px-3 py-2 rounded-lg hover:bg-slate-100">
            📦 Захиалгууд
          </Link>
          <Link href="/admin/products" className="block px-3 py-2 rounded-lg hover:bg-slate-100">
            🏷️ Бараанууд
          </Link>
          <Link href="/admin/settings" className="block px-3 py-2 rounded-lg hover:bg-slate-100">
            🔧 Тохиргоо
          </Link>
        </nav>
        <form action={logoutAction} className="mt-4 pt-3 border-t border-slate-100">
          <button className="text-sm text-red-500 hover:text-red-700 px-3">Гарах</button>
        </form>
      </aside>
      <div>{children}</div>
    </div>
  );
}
