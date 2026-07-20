"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "./Toast";

const POLL_MS = 15000;

/**
 * Admin цэсний "Захиалгууд" дээрх амьд badge: хүлээгдэж буй захиалгын тоог харуулж,
 * шинэ захиалга орж ирмэгц toast мэдэгдэл + хуудсыг сэргээнэ (15с тутам шалгадаг).
 */
export default function AdminOrderWatch() {
  const [pending, setPending] = useState<number | null>(null);
  const lastIdRef = useRef<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const res = await fetch("/api/admin/orders-status", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { lastId: number; pending: number };
        if (!alive) return;
        setPending(data.pending);
        const prev = lastIdRef.current;
        lastIdRef.current = data.lastId;
        if (prev !== null && data.lastId > prev) {
          const n = data.lastId - prev;
          showToast(`🔔 ${n > 1 ? `${n} ширхэг шинэ` : "Шинэ"} захиалга орж ирлээ!`);
          router.refresh(); // Захиалгууд хуудас нээлттэй бол жагсаалт шууд шинэчлэгдэнэ
        }
      } catch {}
    };
    check();
    const t = setInterval(check, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [router]);

  if (!pending) return null;
  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-bold text-zinc-950">
      {pending}
    </span>
  );
}
