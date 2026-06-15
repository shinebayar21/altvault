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
      <div className="text-center py-24">
        <p className="text-slate-500 mb-6">Сагс хоосон байна</p>
        <Link href="/" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg">
          Бараа үзэх
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
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
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
    "w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-white focus:outline-indigo-500";

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-5">Захиалга өгөх</h1>
      <form onSubmit={submit} className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Нэр *</label>
            <input
              required
              className={input}
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Утасны дугаар *</label>
            <input
              required
              className={input}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Хүргэлтийн хаяг *</label>
            <textarea
              required
              rows={2}
              className={input}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Нэмэлт тэмдэглэл</label>
            <input
              className={input}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-sm font-medium mb-3">Төлбөрийн хэлбэр</div>
          <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer has-checked:border-indigo-500 has-checked:bg-indigo-50">
            <input
              type="radio"
              name="pm"
              checked={form.payment_method === "bank"}
              onChange={() => setForm({ ...form, payment_method: "bank" })}
            />
            <span>🏦 Дансаар шилжүүлэх</span>
          </label>
          <label className="mt-2 flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer has-checked:border-indigo-500 has-checked:bg-indigo-50">
            <input
              type="radio"
              name="pm"
              checked={form.payment_method === "qpay"}
              onChange={() => setForm({ ...form, payment_method: "qpay" })}
            />
            <span>📱 QPay</span>
          </label>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          {items.map((i) => (
            <div key={i.id} className="flex justify-between text-sm py-1">
              <span>
                {i.name} × {i.qty}
              </span>
              <span>{tugrug(i.price * i.qty)}</span>
            </div>
          ))}
          <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between font-bold">
            <span>Нийт</span>
            <span className="text-indigo-600">{tugrug(total)}</span>
          </div>
        </div>

        {error && <div className="text-red-600 text-sm bg-red-50 rounded-lg p-3">{error}</div>}

        <button
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Илгээж байна..." : "Захиалга баталгаажуулах"}
        </button>
      </form>
    </div>
  );
}
