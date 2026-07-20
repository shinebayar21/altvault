import db, { Product, Category, Banner } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import HeroSlides from "@/components/HeroSlides";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const { cat, q } = await searchParams;
  const categories = db.prepare("SELECT * FROM categories ORDER BY id").all() as Category[];

  // Категорийн нэрсийг subquery-ээр авдаг тул нэг бараа олон категоритой ч
  // жагсаалтад давхардахгүй; шүүлтийг EXISTS-ээр хийнэ
  let sql = `SELECT p.*, (
               SELECT GROUP_CONCAT(c2.name, ', ')
               FROM product_categories pc JOIN categories c2 ON c2.id = pc.category_id
               WHERE pc.product_id = p.id
             ) AS category_names
             FROM products p
             WHERE p.active = 1`;
  const params: (string | number)[] = [];
  if (cat) {
    sql += ` AND EXISTS (
               SELECT 1 FROM product_categories pc
               JOIN categories c ON c.id = pc.category_id
               WHERE pc.product_id = p.id AND c.slug = ?
             )`;
    params.push(cat);
  }
  if (q) {
    sql += " AND (p.name LIKE ? OR p.description LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += " ORDER BY p.created_at DESC";
  const products = db.prepare(sql).all(...params) as Product[];

  const showHero = !cat && !q;
  const banners = showHero
    ? (db.prepare("SELECT * FROM banners ORDER BY id").all() as Banner[])
    : [];

  return (
    <div>
      {showHero && banners.length > 0 && <HeroSlides banners={banners} />}
      {showHero && banners.length === 0 && (
        <section className="relative mb-10 overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 px-6 py-14 sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-lime-400/15 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-lime-400/10 blur-3xl"
          />
          <div className="relative">
            <div className="mb-4 inline-block rounded-full border border-lime-400/40 bg-lime-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-lime-400">
              Шинэ загварууд ирлээ 🔥
            </div>
            <h1 className="font-display max-w-2xl text-4xl font-extrabold uppercase leading-tight sm:text-6xl">
              Алхам бүр
              <br />
              <span className="text-lime-400">Стиль</span> байг
            </h1>
            <p className="mt-4 max-w-md text-zinc-400">
              Гудамжны соёлоос спортын талбай хүртэл — чиний хөлд тохирох шилдэг пүүзнүүд.
            </p>
            <a
              href="#catalog"
              className="mt-7 inline-block rounded-xl bg-lime-400 px-8 py-3.5 font-bold uppercase tracking-wide text-zinc-950 transition hover:bg-lime-300 hover:shadow-[0_0_30px_rgba(163,230,53,0.35)]"
            >
              Пүүз үзэх ↓
            </a>
          </div>
        </section>
      )}

      <div id="catalog" className="scroll-mt-20">
        <form className="mb-5 flex gap-2" action="/">
          {cat && <input type="hidden" name="cat" value={cat} />}
          <input
            name="q"
            defaultValue={q || ""}
            placeholder="Пүүз хайх..."
            className="max-w-md flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 transition focus:border-lime-400 focus:outline-none"
          />
          <button className="rounded-xl bg-zinc-100 px-5 font-semibold text-zinc-950 transition hover:bg-lime-400">
            Хайх
          </button>
        </form>

        <div className="mb-7 flex flex-wrap gap-2">
          <Link
            href="/"
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              !cat
                ? "border-lime-400 bg-lime-400 text-zinc-950"
                : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            Бүгд
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/?cat=${c.slug}`}
              className={`flex items-center gap-1.5 rounded-full border py-1.5 text-sm font-semibold transition ${
                c.image ? "pl-1.5 pr-4" : "px-4"
              } ${
                cat === c.slug
                  ? "border-lime-400 bg-lime-400 text-zinc-950"
                  : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              {c.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt="" className="h-6 w-6 rounded-full bg-zinc-800 object-cover" />
              )}
              {c.name}
            </Link>
          ))}
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 py-20 text-center text-zinc-500">
            Пүүз олдсонгүй 😕
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
