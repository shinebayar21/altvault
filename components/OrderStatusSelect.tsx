"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { setOrderStatus } from "@/lib/actions";
import { STATUS_LABEL } from "@/lib/format";

/** Захиалгын төлвийг дурын төлөв рүү гараар солих сонголт (солимогц хадгалж, toast гаргана) */
export default function OrderStatusSelect({ orderId, status }: { orderId: number; status: string }) {
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <label className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
      Гараар солих:
      <select
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          startTransition(async () => {
            await setOrderStatus(orderId, next);
            setToast(true);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setToast(false), 2000);
          });
        }}
        className="rounded-xl border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-sm text-zinc-100 transition focus:border-lime-400 focus:outline-none disabled:opacity-50"
      >
        {Object.entries(STATUS_LABEL).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </select>
      {toast && (
        <span className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-lime-400 px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-lg">
          ✓ Төлөв солигдлоо
        </span>
      )}
    </label>
  );
}
