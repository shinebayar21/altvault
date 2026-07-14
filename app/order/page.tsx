"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderLookup() {
  const [value, setValue] = useState("");
  const router = useRouter();

  const submit = () => {
    const v = value.trim();
    if (!v) return;
    const digits = v.replace(/[\s\-+()]/g, "");
    // Зөвхөн тооноос бүрдсэн бол утасны дугаар гэж үзнэ
    if (/^\d{6,}$/.test(digits)) router.push(`/order/phone/${digits}`);
    else router.push(`/order/${v.toUpperCase()}`);
  };

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="font-display mb-2 text-2xl font-extrabold uppercase">Захиалга шалгах</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Захиалгын код (жишээ нь: SH3F2A1B) эсвэл захиалга өгсөн утасны дугаараа оруулна уу
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex gap-2"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Захиалгын код эсвэл утасны дугаар"
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100 placeholder-zinc-600 transition focus:border-lime-400 focus:outline-none"
        />
        <button className="rounded-xl bg-lime-400 px-6 font-bold text-zinc-950 transition hover:bg-lime-300">
          Шалгах
        </button>
      </form>
    </div>
  );
}
