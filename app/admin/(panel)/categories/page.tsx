import db, { Category } from "@/lib/db";
import { addCategory, updateCategory, deleteCategory, removeCategoryImage } from "@/lib/actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";

export const dynamic = "force-dynamic";

type CatRow = Category & { product_count: number };

export default async function AdminCategories() {
  const cats = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
       FROM categories c ORDER BY c.id`
    )
    .all() as CatRow[];

  const input =
    "rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 transition focus:border-lime-400 focus:outline-none";

  return (
    <div>
      <h1 className="font-display mb-4 text-xl font-extrabold uppercase">Категориуд</h1>

      <form
        action={addCategory}
        className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-3"
      >
        <input name="name" required placeholder="Шинэ категорийн нэр..." className={`flex-1 ${input}`} />
        <input name="image" type="file" accept="image/*" className={`max-w-56 ${input}`} />
        <button className="rounded-xl bg-lime-400 px-4 py-1.5 text-sm font-bold text-zinc-950 transition hover:bg-lime-300">
          + Нэмэх
        </button>
      </form>

      <div className="mb-3 text-xs text-zinc-500">
        Нэрийг өөрчлөөд «Хадгалах» дарна. Зураг оруулбал нүүр хуудасны категорийн товч дээр харагдана.
        Категори устгахад бараанууд устахгүй — «Категоригүй» болно.
      </div>

      <div className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-900">
        {cats.length === 0 && (
          <div className="p-6 text-center text-sm text-zinc-500">Категори алга — дээрээс нэмнэ үү</div>
        )}
        {cats.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-3 p-3">
            {c.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.image} alt={c.name} className="h-12 w-12 rounded-xl bg-zinc-800 object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-zinc-700 text-lg text-zinc-600">
                🏷️
              </div>
            )}
            <form action={updateCategory} className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={c.id} />
              <input name="name" required defaultValue={c.name} className={`w-44 ${input}`} />
              <input name="image" type="file" accept="image/*" className={`max-w-52 ${input}`} />
              <button className="rounded-xl bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-950 transition hover:bg-lime-400">
                Хадгалах
              </button>
            </form>
            <span className="shrink-0 text-xs text-zinc-500">{c.product_count} бараа</span>
            {c.image && (
              <form action={removeCategoryImage}>
                <input type="hidden" name="id" value={c.id} />
                <button
                  title="Зургийг арилгах"
                  className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition hover:border-amber-400 hover:text-amber-400"
                >
                  Зураг ✕
                </button>
              </form>
            )}
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={c.id} />
              <ConfirmSubmit
                message={`"${c.name}" категорийг устгах уу? ${c.product_count} бараа "Категоригүй" болно.`}
                className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-red-400 transition hover:border-red-400"
              >
                Устгах
              </ConfirmSubmit>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
