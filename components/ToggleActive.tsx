"use client";

import { useOptimistic, useTransition } from "react";
import { toggleProduct } from "@/lib/actions";

export default function ToggleActive({ id, active }: { id: number; active: boolean }) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(active);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      title={optimistic ? "Веб талд харагдаж байна" : "Веб талд нуугдсан"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await toggleProduct(id, !optimistic);
        })
      }
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
        optimistic ? "bg-lime-400" : "bg-zinc-700"
      } ${pending ? "opacity-60" : ""}`}
    >
      <span
        className={`absolute left-0 top-0.5 block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          optimistic ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
