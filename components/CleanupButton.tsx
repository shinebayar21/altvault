"use client";

import { useActionState } from "react";
import { cleanupUploads } from "@/lib/actions";

export default function CleanupButton() {
  const [state, action, pending] = useActionState<{ message: string }>(cleanupUploads, { message: "" });
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <button
        disabled={pending}
        className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-lime-400 hover:text-lime-400 disabled:opacity-50"
      >
        {pending ? "Цэвэрлэж байна..." : "🧹 Ашиглагдаагүй зургуудыг устгах"}
      </button>
      {state.message && <span className="text-sm text-zinc-400">{state.message}</span>}
    </form>
  );
}
