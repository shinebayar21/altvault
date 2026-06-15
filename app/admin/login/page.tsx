"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions";

export default function AdminLogin() {
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(loginAction, {});
  return (
    <div className="max-w-sm mx-auto py-20">
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <h1 className="text-xl font-bold text-center mb-1">🔐 Админ нэвтрэх</h1>
        <p className="text-sm text-slate-500 text-center mb-6">Дэлгүүрийн удирдлагын хэсэг</p>
        <form action={action} className="space-y-4">
          <input
            type="password"
            name="password"
            required
            placeholder="Нууц үг"
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-indigo-500"
          />
          {state.error && (
            <div className="text-red-600 text-sm bg-red-50 rounded-lg p-3">{state.error}</div>
          )}
          <button
            disabled={pending}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending ? "Шалгаж байна..." : "Нэвтрэх"}
          </button>
        </form>
      </div>
    </div>
  );
}
