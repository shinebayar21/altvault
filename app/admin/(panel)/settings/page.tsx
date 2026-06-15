import { getSettings } from "@/lib/db";
import { saveSettings } from "@/lib/actions";
import { qpayEnabled } from "@/lib/qpay";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const s = getSettings();
  const input =
    "w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-white focus:outline-indigo-500";

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Тохиргоо</h1>
      <form action={saveSettings} className="space-y-4 max-w-xl">
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Дэлгүүрийн нэр</label>
            <input name="store_name" defaultValue={s.store_name} className={input} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Холбоо барих утас</label>
            <input name="phone" defaultValue={s.phone} className={input} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="font-medium text-sm">🏦 Дансаар төлөх тохиргоо</div>
          <div>
            <label className="block text-sm font-medium mb-1">Банкны нэр</label>
            <input name="bank_name" defaultValue={s.bank_name} className={input} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Дансны дугаар</label>
            <input name="bank_account" defaultValue={s.bank_account} className={input} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Хүлээн авагчийн нэр</label>
            <input name="bank_holder" defaultValue={s.bank_holder} className={input} />
          </div>
        </div>

        <div
          className={`rounded-xl border p-4 text-sm ${
            qpayEnabled()
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-slate-50 border-slate-200 text-slate-600"
          }`}
        >
          {qpayEnabled() ? (
            <>✅ QPay холбогдсон — захиалга өгөхөд QPay QR автоматаар үүснэ.</>
          ) : (
            <>
              ℹ️ QPay одоогоор идэвхгүй. QPay-тэй мерчант гэрээ хийсний дараа төслийн{" "}
              <code className="bg-white px-1 rounded">.env.local</code> файл дотор QPAY_USERNAME,
              QPAY_PASSWORD, QPAY_INVOICE_CODE-г бөглөөд серверээ дахин асаахад автоматаар
              идэвхжинэ. Тэр болтол захиалгууд дансаар төлөх горимоор ажиллана.
            </>
          )}
        </div>

        <button className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-indigo-700">
          Хадгалах
        </button>
      </form>
    </div>
  );
}
