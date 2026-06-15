"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderLookup() {
  const [code, setCode] = useState("");
  const router = useRouter();
  return (
    <div className="max-w-md mx-auto py-16 text-center">
      <h1 className="text-xl font-bold mb-2">Захиалга шалгах</h1>
      <p className="text-sm text-slate-500 mb-6">
        Захиалгын кодоо оруулна уу (жишээ нь: SH3F2A1B)
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) router.push(`/order/${code.trim().toUpperCase()}`);
        }}
        className="flex gap-2"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Захиалгын код"
          className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 bg-white focus:outline-indigo-500"
        />
        <button className="bg-indigo-600 text-white px-6 rounded-lg hover:bg-indigo-700">Шалгах</button>
      </form>
    </div>
  );
}
