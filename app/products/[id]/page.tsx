import db, { Product } from "@/lib/db";
import { tugrug } from "@/lib/format";
import AddToCart from "@/components/AddToCart";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = db
    .prepare(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ? AND p.active = 1`
    )
    .get(Number(id)) as Product | undefined;

  if (!p) notFound();

  return (
    <div>
      <Link href="/" className="text-sm text-slate-500 hover:text-indigo-600">
        ← Буцах
      </Link>
      <div className="mt-4 grid md:grid-cols-2 gap-8 bg-white rounded-2xl border border-slate-200 p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.image}
          alt={p.name}
          className="w-full aspect-square object-cover rounded-xl bg-slate-100"
        />
        <div>
          {p.category_name && (
            <div className="text-xs uppercase tracking-wide text-indigo-500 mb-2">
              {p.category_name}
            </div>
          )}
          <h1 className="text-2xl font-bold">{p.name}</h1>
          <div className="mt-3 text-3xl font-bold text-indigo-600">{tugrug(p.price)}</div>
          <div className="mt-2 text-sm text-slate-500">
            {p.stock > 0 ? `Үлдэгдэл: ${p.stock} ширхэг` : "Дууссан"}
          </div>
          <p className="mt-4 text-slate-700 leading-relaxed whitespace-pre-line">{p.description}</p>
          <div className="mt-6">
            <AddToCart p={p} />
          </div>
        </div>
      </div>
    </div>
  );
}
