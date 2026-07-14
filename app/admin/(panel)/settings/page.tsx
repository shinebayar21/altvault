import { getSettings } from "@/lib/db";
import { saveSettings } from "@/lib/actions";
import { qpayEnabled } from "@/lib/qpay";
import { wireEnabled } from "@/lib/wire";
import CleanupButton from "@/components/CleanupButton";
import ActionForm from "@/components/ActionForm";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const s = getSettings();
  const input =
    "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 transition focus:border-lime-400 focus:outline-none";

  return (
    <div>
      <h1 className="font-display mb-4 text-xl font-extrabold uppercase">Тохиргоо</h1>
      <ActionForm action={saveSettings} success="Тохиргоо хадгалагдлаа" className="max-w-xl space-y-4">
        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Дэлгүүрийн нэр</label>
            <input name="store_name" defaultValue={s.store_name} className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Холбоо барих утас</label>
            <input name="phone" defaultValue={s.phone} className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              Лого (нэрний хажууд, дээд цэсэнд гарна)
            </label>
            {s.store_logo ? (
              <div className="mb-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.store_logo} alt="Лого" className="h-12 w-12 rounded-xl bg-zinc-800 object-contain p-1" />
                <label className="flex cursor-pointer items-center gap-2 text-sm text-red-400">
                  <input type="checkbox" name="remove_logo" className="accent-red-400" />
                  Логог арилгах (👟 руу буцна)
                </label>
              </div>
            ) : (
              <p className="mb-2 text-xs text-zinc-500">Лого байхгүй — одоогоор 👟 гарч байгаа</p>
            )}
            <input name="logo" type="file" accept="image/*" className={input} />
            <p className="mt-1.5 text-xs text-zinc-500">
              Дөрвөлжинд ойр, тунгалаг (PNG) дэвсгэртэй зураг тохиромжтой
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            🏦 Дансаар төлөх тохиргоо
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Банкны нэр</label>
            <input name="bank_name" defaultValue={s.bank_name} className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Дансны дугаар</label>
            <input name="bank_account" defaultValue={s.bank_account} className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Хүлээн авагчийн нэр</label>
            <input name="bank_holder" defaultValue={s.bank_holder} className={input} />
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            💳 Wire (wirepayment.mn) QR төлбөр
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">API key</label>
            <input
              name="wire_api_key"
              defaultValue={s.wire_api_key}
              placeholder="sk_live_..."
              autoComplete="off"
              className={input}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Webhook secret</label>
            <input
              name="wire_webhook_secret"
              defaultValue={s.wire_webhook_secret}
              placeholder="whsec_..."
              autoComplete="off"
              className={input}
            />
          </div>
          <p className="text-xs text-zinc-500">
            Wire dashboard дээр webhook хаягаа{" "}
            <code className="rounded bg-zinc-800 px-1">https://altvault.uk/api/wire/callback</code>{" "}
            гэж бүртгүүлээрэй. Хоёр талбарыг бөглөж хадгалмагц QR төлбөр шууд идэвхжинэ — сервер
            дахин асаах шаардлагагүй.
          </p>
        </div>

        <div
          className={`rounded-2xl border p-4 text-sm ${
            wireEnabled() || qpayEnabled()
              ? "border-lime-400/30 bg-lime-400/10 text-lime-300"
              : "border-zinc-800 bg-zinc-900 text-zinc-400"
          }`}
        >
          {wireEnabled() ? (
            <>✅ Wire холбогдсон — захиалга өгөхөд QPay QR автоматаар үүснэ.</>
          ) : qpayEnabled() ? (
            <>✅ QPay холбогдсон — захиалга өгөхөд QPay QR автоматаар үүснэ.</>
          ) : (
            <>
              ℹ️ QR төлбөр одоогоор идэвхгүй. Дээрх Wire талбаруудыг бөглөж хадгалахад автоматаар
              идэвхжинэ. Тэр болтол захиалгууд дансаар төлөх горимоор ажиллана.
            </>
          )}
        </div>

        <button className="rounded-xl bg-lime-400 px-8 py-2.5 font-bold uppercase tracking-wide text-zinc-950 transition hover:bg-lime-300 disabled:opacity-50">
          Хадгалах
        </button>
      </ActionForm>

      <div className="mt-6 max-w-xl space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          🗄️ Дискний зай
        </div>
        <p className="text-xs text-zinc-500">
          Зураг солиход хуучин файл нь одоо автоматаар устдаг. Өмнө нь хуримтлагдсан илүүдэл
          файлуудыг доорх товчоор нэг мөр цэвэрлэнэ (сүүлийн 1 цагт орж ирсэн файлд хүрэхгүй).
        </p>
        <CleanupButton />
      </div>
    </div>
  );
}
