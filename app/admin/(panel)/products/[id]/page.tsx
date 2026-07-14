import db, { Category, Product } from "@/lib/db";
import ProductForm from "@/components/ProductForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(Number(id)) as
    | Product
    | undefined;
  if (!product) notFound();
  const categories = db.prepare("SELECT * FROM categories ORDER BY name").all() as Category[];
  return (
    <div>
      <h1 className="font-display mb-4 text-xl font-extrabold uppercase">Бараа засах</h1>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
