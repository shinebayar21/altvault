import db, { Order } from "@/lib/db";
import { tugrug, STATUS_LABEL, STATUS_COLOR } from "@/lib/format";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

/** Утасны дугаараар захиалгууд хайх — DB талд ч, хайлтын утга ч зөвхөн цифрээр жишинэ */
export default async function OrdersByPhone({ params }: { params: Promise<{ phone: string }> }) {
  const { phone } = await params;
  const digits = decodeURIComponent(phone).replace(/\D/g, "");

  const orders =
    digits.length >= 6
      ? (db
          .prepare(
            `SELECT * FROM orders
             WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'+',''),'(',''),')','') = ?
             ORDER BY id DESC`
          )
          .all(digits) as Order[])
      : [];

  // Ганц захиалга олдвол шууд дэлгэрэнгүй рүү нь
  if (orders.length === 1) redirect(`/order/${orders[0].code}`);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display mb-1 text-2xl font-extrabold uppercase">Захиалга шалгах</h1>
      <p className="mb-6 text-sm text-zinc-500">
        {digits} дугаартай {orders.length > 0 ? `${orders.length} захиалга олдлоо` : "захиалга олдсонгүй"}
      </p>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 py-16 text-center text-zinc-500">
          Энэ утасны дугаараар захиалга олдсонгүй 😕
          <div className="mt-4">
            <Link href="/order" className="text-sm text-lime-400 hover:underline">
              ← Дахин хайх
            </Link>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-900">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/order/${o.code}`}
              className="flex flex-wrap items-center gap-3 p-4 transition hover:bg-zinc-800/50"
            >
              <div className="min-w-0 flex-1">
                <div className="font-display font-bold text-lime-400">{o.code}</div>
                <div className="mt-0.5 text-xs text-zinc-500">{o.created_at}</div>
              </div>
              <div className="text-sm font-semibold">{tugrug(o.total)}</div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[o.status]}`}>
                {STATUS_LABEL[o.status]}
              </span>
              <span className="text-zinc-600">→</span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 text-center">
        <Link href="/" className="text-sm text-lime-400 hover:underline">
          ← Дэлгүүр рүү буцах
        </Link>
      </div>
    </div>
  );
}
