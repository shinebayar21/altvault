import db, { Product, Category } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const { cat, q } = await searchParams;
  const categories = db.prepare("SELECT * FROM categories ORDER BY name").all() as Category[];

  let sql = `SELECT p.*, c.name as category_name FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.active = 1`;
  const params: (string | number)[] = [];
  if (cat) {
    sql += " AND c.slug = ?";
    params.push(cat);
  }
  if (q) {
    sql += " AND (p.name LIKE ? OR p.description LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += " ORDER BY p.created_at DESC";
  const products = db.prepare(sql).all(...params) as Product[];

  return (
    <div>
      <form className="mb-5 flex gap-2" action="/">
        {cat && <input type="hidden" name="cat" value={cat} />}
        <input
          name="q"
          defaultValue={q || ""}
          placeholder="Бараа хайх..."
          className="flex-1 max-w-md border border-slate-300 rounded-lg px-4 py-2 bg-white focus:outline-indigo-500"
        />
        <button className="bg-indigo-600 text-white px-5 rounded-lg hover:bg-indigo-700">Хайх</button>
      </form>

      <div className="flex gap-2 flex-wrap mb-6">
        <Link
          href="/"
          className={`px-4 py-1.5 rounded-full text-sm border ${
            !cat ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-300 hover:border-indigo-400"
          }`}
        >
          Бүгд
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/?cat=${c.slug}`}
            className={`px-4 py-1.5 rounded-full text-sm border ${
              cat === c.slug
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white border-slate-300 hover:border-indigo-400"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 text-slate-500">Бараа олдсонгүй</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
