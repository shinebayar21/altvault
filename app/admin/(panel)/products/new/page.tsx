import db, { Category } from "@/lib/db";
import ProductForm from "@/components/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProduct() {
  const categories = db.prepare("SELECT * FROM categories ORDER BY name").all() as Category[];
  return (
    <div>
      <h1 className="font-display mb-4 text-xl font-extrabold uppercase">Шинэ бараа нэмэх</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
