import type { Order } from "@/lib/db";
import { setOrderTrack, refreshOrderTrack } from "@/lib/actions";
import { TRACK_COMS, TRACK_STATE_LABEL, TRACK_STATE_COLOR, parseTrackData } from "@/lib/track";

const inputCls =
  "rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 transition focus:border-lime-400 focus:outline-none";

/** Захиалгын Хятад талын илгээмжийн tracking хэсэг (админ) */
export default function OrderTrack({ order }: { order: Order }) {
  const td = parseTrackData(order.track_data);
  const comLabel = TRACK_COMS.find((c) => c.code === order.track_com)?.label || order.track_com;

  const editForm = (
    <form action={setOrderTrack.bind(null, order.id)} className="flex flex-wrap items-center gap-2">
      <select name="track_com" defaultValue={order.track_com || "zhongtong"} className={inputCls}>
        {TRACK_COMS.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
      <input
        name="track_no"
        defaultValue={order.track_no}
        placeholder="Илгээмжийн дугаар"
        className={`${inputCls} w-48`}
      />
      <button className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-950 transition hover:bg-lime-400">
        Хадгалах
      </button>
    </form>
  );

  if (!order.track_no)
    return (
      <details className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
        <summary className="cursor-pointer text-sm text-zinc-400 transition hover:text-zinc-200">
          📦 Хятад tracking холбох
        </summary>
        <div className="mt-2.5">{editForm}</div>
      </details>
    );

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-zinc-400">📦 {comLabel}</span>
        <span className="font-mono text-zinc-200">{order.track_no}</span>
        {td?.error ? (
          <span className="rounded-full border border-red-400/30 bg-red-400/15 px-2.5 py-0.5 text-xs font-semibold text-red-400">
            {td.error}
          </span>
        ) : (
          td && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                TRACK_STATE_COLOR[td.state] || "border border-zinc-500/30 bg-zinc-400/15 text-zinc-300"
              }`}
            >
              {TRACK_STATE_LABEL[td.state] || `Төлөв ${td.state}`}
            </span>
          )
        )}
        {td && <span className="text-xs text-zinc-600">шалгасан: {td.checked}</span>}
        <form action={refreshOrderTrack.bind(null, order.id)}>
          <button className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-lime-400 hover:text-lime-400">
            ⟳ Шинэчлэх
          </button>
        </form>
      </div>
      {td && td.events.length > 0 && (
        <div className="text-xs text-zinc-400">
          <span className="text-zinc-600">{td.events[0].time}</span> — {td.events[0].context}
        </div>
      )}
      <details>
        <summary className="cursor-pointer text-xs text-zinc-500 transition hover:text-zinc-300">
          Бүх явц / дугаар засах
        </summary>
        <div className="mt-2 space-y-2.5">
          {td && td.events.length > 1 && (
            <ol className="space-y-1 border-l border-zinc-800 pl-3">
              {td.events.map((e, i) => (
                <li key={i} className="text-xs text-zinc-400">
                  <span className="text-zinc-600">{e.time}</span> — {e.context}
                </li>
              ))}
            </ol>
          )}
          {editForm}
          <p className="text-xs text-zinc-600">Дугаарыг хоосон болгож хадгалбал tracking салгана.</p>
        </div>
      </details>
    </div>
  );
}
