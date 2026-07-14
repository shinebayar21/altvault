"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions";

export default function AdminLogin() {
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(loginAction, {});
  return (
    <div className="mx-auto max-w-sm py-20">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="font-display mb-1 text-center text-xl font-extrabold uppercase">
          🔐 Админ нэвтрэх
        </h1>
        <p className="mb-6 text-center text-sm text-zinc-500">Дэлгүүрийн удирдлагын хэсэг</p>
        <form action={action} className="space-y-4">
          <input
            type="text"
            name="username"
            required
            placeholder="Нэвтрэх нэр"
            autoComplete="username"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-600 transition focus:border-lime-400 focus:outline-none"
          />
          <input
            type="password"
            name="password"
            required
            placeholder="Нууц үг"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-600 transition focus:border-lime-400 focus:outline-none"
          />
          {state.error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {state.error}
            </div>
          )}
          <button
            disabled={pending}
            className="w-full rounded-xl bg-lime-400 py-2.5 font-bold uppercase tracking-wide text-zinc-950 transition hover:bg-lime-300 disabled:opacity-50"
          >
            {pending ? "Шалгаж байна..." : "Нэвтрэх"}
          </button>
        </form>
      </div>
    </div>
  );
}
