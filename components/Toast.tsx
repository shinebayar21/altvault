"use client";

import { useEffect, useState } from "react";

/** Хаанаас ч мэдэгдэл харуулна — root layout-д суусан тул хуудас солиход алга болохгүй */
export function showToast(msg: string) {
  window.dispatchEvent(new CustomEvent("shop:toast", { detail: msg }));
}

export default function Toast() {
  const [msg, setMsg] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hide: ReturnType<typeof setTimeout>;
    const on = (e: Event) => {
      const m = String((e as CustomEvent).detail || "");
      if (!m) return;
      setMsg(m);
      setVisible(true);
      clearTimeout(hide);
      hide = setTimeout(() => setVisible(false), 3000);
    };
    window.addEventListener("shop:toast", on);
    return () => {
      window.removeEventListener("shop:toast", on);
      clearTimeout(hide);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed left-1/2 top-20 z-50 -translate-x-1/2 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
      }`}
    >
      {msg && (
        <div className="rounded-2xl border border-lime-400/40 bg-zinc-900/95 px-5 py-3 text-sm font-semibold text-lime-400 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
          {msg}
        </div>
      )}
    </div>
  );
}
