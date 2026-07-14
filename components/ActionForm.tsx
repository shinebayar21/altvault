"use client";

import { useActionState, useEffect, useRef, useState } from "react";

type Result = { ok?: number; err?: number };

/**
 * Server action-тай форм: хадгалж дуустал бүх талбар/товчийг түгжиж (давхар
 * даралтаас сэргийлнэ), амжилттай болмогц "✓" мэдэгдэл гаргана.
 */
export default function ActionForm({
  action,
  success = "Амжилттай хадгалагдлаа",
  resetOnSuccess = false,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<unknown>;
  success?: string;
  resetOnSuccess?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<Result, FormData>(
    async (_prev, fd) => {
      try {
        await action(fd);
        return { ok: Date.now() };
      } catch {
        return { err: Date.now() };
      }
    },
    {}
  );
  const [toast, setToast] = useState<"ok" | "err" | null>(null);

  useEffect(() => {
    if (!state.ok && !state.err) return;
    if (state.ok && resetOnSuccess) formRef.current?.reset();
    setToast(state.ok ? "ok" : "err");
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [state, resetOnSuccess]);

  return (
    <form ref={formRef} action={formAction} className={className}>
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-lg ${
            toast === "ok" ? "bg-lime-400 text-zinc-950" : "bg-red-500 text-white"
          }`}
        >
          {toast === "ok" ? `✓ ${success}` : "✕ Алдаа гарлаа — дахин оролдоно уу"}
        </div>
      )}
    </form>
  );
}
