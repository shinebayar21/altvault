import db, { Product } from "@/lib/db";
import ProductView from "@/components/ProductView";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = db
    .prepare(
      `SELECT p.*, (
         SELECT GROUP_CONCAT(c2.name, ', ')
         FROM product_categories pc JOIN categories c2 ON c2.id = pc.category_id
         WHERE pc.product_id = p.id
       ) AS category_names
       FROM products p WHERE p.id = ? AND p.active = 1`
    )
    .get(Number(id)) as Product | undefined;

  if (!p) notFound();

  return (
    <div>
      <Link href="/" className="text-sm text-zinc-500 transition hover:text-lime-400">
        ← Буцах
      </Link>
      <ProductView p={p} />
    </div>
  );
}
