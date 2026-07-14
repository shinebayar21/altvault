import db, { Product } from "@/lib/db";
import ProductView from "@/components/ProductView";
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
      <Link href="/" className="text-sm text-zinc-500 transition hover:text-lime-400">
        ← Буцах
      </Link>
      <ProductView p={p} />
    </div>
  );
}
