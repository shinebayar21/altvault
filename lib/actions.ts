"use server";

import db from "@/lib/db";
import { makeToken, requireAdmin, AUTH_COOKIE } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";

// ---------- Нэвтрэлт ----------
export async function loginAction(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const password = formData.get("password") as string;
  if (password !== (process.env.ADMIN_PASSWORD || "admin123")) {
    return { error: "Нууц үг буруу байна" };
  }
  const c = await cookies();
  c.set(AUTH_COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  redirect("/admin");
}

export async function logoutAction() {
  const c = await cookies();
  c.delete(AUTH_COOKIE);
  redirect("/admin/login");
}

// ---------- Захиалга ----------
export async function setOrderStatus(orderId: number, status: string) {
  await requireAdmin();
  if (!["pending", "paid", "delivered", "cancelled"].includes(status)) return;

  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as
    | { id: number; status: string }
    | undefined;
  if (!order) return;

  // Цуцлахад барааны үлдэгдлийг буцаана
  if (status === "cancelled" && order.status !== "cancelled") {
    const items = db
      .prepare("SELECT product_id, qty FROM order_items WHERE order_id = ?")
      .all(orderId) as { product_id: number | null; qty: number }[];
    const inc = db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
    for (const it of items) if (it.product_id) inc.run(it.qty, it.product_id);
  }
  // Цуцалснаас буцаахад үлдэгдлийг дахин хасна
  if (order.status === "cancelled" && status !== "cancelled") {
    const items = db
      .prepare("SELECT product_id, qty FROM order_items WHERE order_id = ?")
      .all(orderId) as { product_id: number | null; qty: number }[];
    const dec = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
    for (const it of items) if (it.product_id) dec.run(it.qty, it.product_id);
  }

  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, orderId);
  revalidatePath("/admin/orders");
}

// ---------- Бараа ----------
async function saveImage(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > 5 * 1024 * 1024) throw new Error("Зураг 5MB-аас бага байх ёстой");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const name = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "data", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(dir, name), buf);
  return `/api/uploads/${name}`;
}

export async function saveProduct(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();
  const id = Number(formData.get("id") || 0);
  const name = (formData.get("name") as string)?.trim();
  const description = ((formData.get("description") as string) || "").trim();
  const price = Math.floor(Number(formData.get("price")));
  const stock = Math.floor(Number(formData.get("stock")));
  const category_id = Number(formData.get("category_id")) || null;
  const active = formData.get("active") ? 1 : 0;

  if (!name || !price || price < 0 || stock < 0 || isNaN(stock))
    return { error: "Нэр, үнэ, үлдэгдлээ зөв бөглөнө үү" };

  let image: string | null = null;
  try {
    image = await saveImage(formData.get("image") as File | null);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Зураг хадгалахад алдаа гарлаа" };
  }

  if (id) {
    if (image) {
      db.prepare(
        "UPDATE products SET name=?, description=?, price=?, stock=?, category_id=?, active=?, image=? WHERE id=?"
      ).run(name, description, price, stock, category_id, active, image, id);
    } else {
      db.prepare(
        "UPDATE products SET name=?, description=?, price=?, stock=?, category_id=?, active=? WHERE id=?"
      ).run(name, description, price, stock, category_id, active, id);
    }
  } else {
    db.prepare(
      "INSERT INTO products (name, description, price, stock, category_id, active, image) VALUES (?,?,?,?,?,?,?)"
    ).run(name, description, price, stock, category_id, active, image || "/img/placeholder.svg");
  }
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProduct(id: number) {
  await requireAdmin();
  db.prepare("UPDATE products SET active = 0 WHERE id = ?").run(id);
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function restoreProduct(id: number) {
  await requireAdmin();
  db.prepare("UPDATE products SET active = 1 WHERE id = ?").run(id);
  revalidatePath("/admin/products");
  revalidatePath("/");
}

// ---------- Категори ----------
export async function addCategory(formData: FormData) {
  await requireAdmin();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;
  const slug =
    name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9а-яөү-]/g, "") || `cat-${Date.now()}`;
  try {
    db.prepare("INSERT INTO categories (name, slug) VALUES (?, ?)").run(name, slug);
  } catch {}
  revalidatePath("/admin/products");
}

// ---------- Тохиргоо ----------
export async function saveSettings(formData: FormData) {
  await requireAdmin();
  const keys = ["store_name", "bank_name", "bank_account", "bank_holder", "phone"];
  const up = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );
  for (const k of keys) {
    const v = (formData.get(k) as string) ?? "";
    up.run(k, v.trim());
  }
  revalidatePath("/");
  revalidatePath("/admin/settings");
}
