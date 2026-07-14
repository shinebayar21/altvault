"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckPaymentButton({ code }: { code: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function check() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/orders/${code}/check`, { method: "POST" });
      const data = await res.json();
      if (data.paid) {
        router.refresh();
      } else {
        setMsg("Төлбөр хараахан ороогүй байна. Төлсний дараа дахин шалгана уу.");
      }
    } catch {
      setMsg("Шалгахад алдаа гарлаа");
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={check}
        disabled={loading}
        className="rounded-xl bg-lime-400 px-6 py-2 text-sm font-bold text-zinc-950 transition hover:bg-lime-300 disabled:opacity-50"
      >
        {loading ? "Шалгаж байна..." : "Төлбөр шалгах"}
      </button>
      {msg && <p className="mt-2 text-sm text-amber-400">{msg}</p>}
    </div>
  );
}
