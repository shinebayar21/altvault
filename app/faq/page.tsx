import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Түгээмэл асуулт",
  description: "Хүргэлт, буцаалт, барааны гарал үүслийн талаарх түгээмэл асуултууд",
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Бараа хэр удаж байж орж ирэх вэ?",
    a: (
      <>
        Таны захиалсан бараа <b className="text-zinc-200">6-8 хоногийн дотор</b> таны гар дээр
        хүргэгдэх болно.
      </>
    ),
  },
  {
    q: "Захиалсан бараагаа буцааж болдог уу?",
    a: (
      <>
        Болно. Бид таны буцаасан барааг өмссөн байдал, урагдал, элэгдэл байгаа эсэхийг шалгаж
        үзсэний дараа танд <b className="text-zinc-200">100% буцаан олголт</b> өгөх болно. Харин
        дээр дурдсан зүйлсийг шалгаж үзээд таны бараа тэнцээгүй тохиолдолд буцаан олголт өгөх
        боломжгүйг анхаарна уу.
      </>
    ),
  },
  {
    q: "Бараа хаанаас ирдэг вэ?",
    a: (
      <>
        Манай бараанууд <b className="text-zinc-200">UK, Малайз, Хятад</b> гэсэн 3 улсаас тус бүр
        сонгогдсон загваруудаар ирдэг.
      </>
    ),
  },
  {
    q: "Superclone пүүз гэж юу вэ?",
    a: (
      <>
        1:1 буюу бүх деталь болоод ашиглагдаж буй материал, технологи, загвар, хийцийн хувьд төгс
        хуулбарласан пүүзнүүдийг хэлнэ. Манай дэлгүүр танд{" "}
        <b className="text-zinc-200">брэндийн нэмэлт төлбөр төлөхгүйгээр</b> худалдан авах
        боломжийг олгож байгаа хэрэг юм :)
        <span className="mt-2 block text-sm text-zinc-500">
          Манай барааг олон газар бөөнөөр аваад «оригинал» гэж зардаг тул бид өөрсдийн вэбсайтаа
          хөгжүүлж, худалдан авалтын сувгийг нэмэлт дамжлагагүй болгох зорилготой энэхүү вэбийг
          хийсэн.
        </span>
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display mb-2 text-2xl font-extrabold uppercase">
        Түгээмэл асуулт<span className="text-lime-400">?</span>
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Танд өөр асуулт байвал бидэнтэй холбогдоорой — footer хэсэгт утасны дугаар бий.
      </p>
      <div className="space-y-3">
        {FAQS.map((f) => (
          <details
            key={f.q}
            className="group rounded-2xl border border-zinc-800 bg-zinc-900 open:border-lime-400/40"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold text-zinc-100 transition hover:text-lime-400 [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="shrink-0 text-lime-400 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="border-t border-zinc-800 p-4 leading-relaxed text-zinc-400">{f.a}</div>
          </details>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/"
          className="inline-block rounded-xl bg-lime-400 px-8 py-3 font-bold uppercase tracking-wide text-zinc-950 transition hover:bg-lime-300"
        >
          Пүүз үзэх
        </Link>
      </div>
    </div>
  );
}
