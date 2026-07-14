import db, { Banner } from "@/lib/db";
import { deleteBanner } from "@/lib/actions";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import BannerForm from "@/components/BannerForm";

export const dynamic = "force-dynamic";

export default async function AdminBanners() {
  const banners = db.prepare("SELECT * FROM banners ORDER BY id").all() as Banner[];

  return (
    <div>
      <h1 className="font-display mb-4 text-xl font-extrabold uppercase">Реклам (нүүрний слайд)</h1>

      <div className="mb-3 text-xs text-zinc-500">
        Зураг + түүн дээр гарах бичгээ доороос тохируулна — фонт, өнгө, текст урьдчилан харагдана.
        Нүүр хуудсанд 5 секунд тутамд зураг текстийнхээ хамт ээлжлэн гарна. Гарчиг хоосон бол
        «Алхам бүр Стиль байг» үндсэн текст гарна. Өргөн (landscape) зураг тохиромжтой.
      </div>

      <div className="mb-6 rounded-2xl border border-lime-400/30 bg-zinc-900 p-4">
        <div className="mb-3 text-sm font-bold uppercase tracking-wide text-lime-400">Шинэ реклам</div>
        <BannerForm />
      </div>

      {banners.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 py-16 text-center text-sm text-zinc-500">
          Реклам зураг алга — дээрээс нэмнэ үү
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {banners.map((b, i) => (
            <div key={b.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Слайд #{i + 1}
                </span>
                <form action={deleteBanner}>
                  <input type="hidden" name="id" value={b.id} />
                  <ConfirmSubmit
                    message="Энэ реклам зургийг устгах уу?"
                    className="rounded-xl border border-zinc-700 px-3 py-1 text-xs text-red-400 transition hover:border-red-400"
                  >
                    Устгах
                  </ConfirmSubmit>
                </form>
              </div>
              <BannerForm banner={b} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
