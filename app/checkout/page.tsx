"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { tugrug } from "@/lib/format";
import Link from "next/link";

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    address: "",
    note: "",
    payment_method: "bank",
  });

  if (items.length === 0)
    return (
      <div className="py-24 text-center">
        <p className="mb-6 text-zinc-500">Сагс хоосон байна</p>
        <Link
          href="/"
          className="rounded-xl bg-lime-400 px-8 py-3 font-bold uppercase tracking-wide text-zinc-950 hover:bg-lime-300"
        >
          Пүүз үзэх
        </Link>
      </div>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: items.map((i) => ({ id: i.id, qty: i.qty, size: i.size, color: i.color })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Алдаа гарлаа");
      clear();
      router.push(`/order/${data.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      setLoading(false);
    }
  }

  const input =
    "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-600 transition focus:border-lime-400 focus:outline-none";
  const card = "rounded-2xl border border-zinc-800 bg-zinc-900 p-5";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display mb-6 text-2xl font-extrabold uppercase">Захиалга өгөх</h1>
      <form onSubmit={submit} className="space-y-4">
        <div className={`${card} space-y-4`}>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Нэр *</label>
            <input
              required
              className={input}
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Утасны дугаар *</label>
            <input
              required
              type="tel"
              className={input}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Хүргэлтийн хаяг *</label>
            <textarea
              required
              rows={2}
              className={input}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Нэмэлт тэмдэглэл</label>
            <input
              className={input}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
        </div>

        <div className={card}>
          <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Төлбөрийн хэлбэр
          </div>
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${
              form.payment_method === "bank"
                ? "border-lime-400 bg-lime-400/10"
                : "border-zinc-700 hover:border-zinc-500"
            }`}
          >
            <input
              type="radio"
              name="pm"
              className="accent-lime-400"
              checked={form.payment_method === "bank"}
              onChange={() => setForm({ ...form, payment_method: "bank" })}
            />
            <span>🏦 Дансаар шилжүүлэх</span>
          </label>
          <label
            className={`mt-2 flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${
              form.payment_method === "qpay"
                ? "border-lime-400 bg-lime-400/10"
                : "border-zinc-700 hover:border-zinc-500"
            }`}
          >
            <input
              type="radio"
              name="pm"
              className="accent-lime-400"
              checked={form.payment_method === "qpay"}
              onChange={() => setForm({ ...form, payment_method: "qpay" })}
            />
            <span>📱 QPay</span>
          </label>
        </div>

        <div className={card}>
          {items.map((i) => (
            <div key={i.key} className="flex justify-between py-1 text-sm">
              <span className="text-zinc-300">
                {i.name}
                {(i.size || i.color) && (
                  <span className="text-zinc-500">
                    {" "}
                    ({[i.size && `размер ${i.size}`, i.color].filter(Boolean).join(", ")})
                  </span>
                )}{" "}
                × {i.qty}
              </span>
              <span>{tugrug(i.price * i.qty)}</span>
            </div>
          ))}
          <div className="mt-3 flex justify-between border-t border-zinc-800 pt-3 font-bold">
            <span>Нийт</span>
            <span className="text-lime-400">{tugrug(total)}</span>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-lime-400 py-4 font-bold uppercase tracking-wide text-zinc-950 transition hover:bg-lime-300 disabled:opacity-50"
        >
          {loading ? "Илгээж байна..." : "Захиалга баталгаажуулах"}
        </button>
      </form>
    </div>
  );
}
