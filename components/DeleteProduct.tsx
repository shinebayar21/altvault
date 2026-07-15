"use client";

import { useTransition } from "react";
import { deleteProduct } from "@/lib/actions";

/** Барааг бүрмөсөн устгах товч — баталгаажуулалт асуудаг */
export default function DeleteProduct({ id, name }: { id: number; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      title="Барааг бүрмөсөн устгах"
      onClick={() => {
        if (
          !confirm(
            `"${name}" барааг бүрмөсөн устгах уу?\n\nЗургууд нь хамт устана, буцаах боломжгүй. Захиалгын түүх хэвээр үлдэнэ.\n\n(Түр нуух бол ногоон toggle-ийг унтраахад хангалттай.)`
          )
        )
          return;
        startTransition(() => deleteProduct(id));
      }}
      className="shrink-0 rounded-xl border border-red-400/40 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-400/10 disabled:opacity-50"
    >
      {pending ? "..." : "Устгах"}
    </button>
  );
}
