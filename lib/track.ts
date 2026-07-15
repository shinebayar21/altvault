// Хятад доторх илгээмжийн tracking — Kuaidi100-ийн нээлттэй query endpoint.
// Албан бус endpoint тул алдаа бүрийг залгиж, кэшилсэн үр дүнгээр ажиллана.

export const TRACK_COMS: { code: string; label: string }[] = [
  { code: "zhongtong", label: "ZTO 中通" },
  { code: "yuantong", label: "YTO 圆通" },
  { code: "shentong", label: "STO 申通" },
  { code: "yunda", label: "Yunda 韵达" },
  { code: "shunfeng", label: "SF 顺丰" },
  { code: "jtexpress", label: "J&T 极兔" },
  { code: "ems", label: "EMS" },
  { code: "youzhengguonei", label: "China Post 邮政" },
  { code: "debangwuliu", label: "Deppon 德邦" },
  { code: "jd", label: "JD 京东" },
];

export type TrackEvent = { time: string; context: string };

export type TrackData = {
  /** Kuaidi100 state код ("0" замд ... "3" хүргэгдсэн); алдаатай үед хоосон */
  state: string;
  events: TrackEvent[];
  /** Сүүлд шалгасан цаг (UTC, created_at-тай ижил формат) */
  checked: string;
  error?: string;
};

export const TRACK_STATE_LABEL: Record<string, string> = {
  "0": "Замд яваа",
  "1": "Илгээмжийг хүлээн авсан",
  "2": "Асуудал гарсан",
  "3": "Хүргэгдсэн (Хятад дахь хаягт)",
  "4": "Буцаагдсан",
  "5": "Хүргэлтэнд гарсан",
  "6": "Буцааж явуулж байна",
  "7": "Дамжуулагдсан",
};

export const TRACK_STATE_COLOR: Record<string, string> = {
  "0": "bg-violet-400/15 text-violet-400 border border-violet-400/30",
  "1": "bg-amber-400/15 text-amber-400 border border-amber-400/30",
  "2": "bg-red-400/15 text-red-400 border border-red-400/30",
  "3": "bg-sky-400/15 text-sky-400 border border-sky-400/30",
  "4": "bg-red-400/15 text-red-400 border border-red-400/30",
  "5": "bg-violet-400/15 text-violet-400 border border-violet-400/30",
  "6": "bg-red-400/15 text-red-400 border border-red-400/30",
  "7": "bg-zinc-400/15 text-zinc-300 border border-zinc-500/30",
};

export function parseTrackData(v: string | null | undefined): TrackData | null {
  if (!v) return null;
  try {
    const d = JSON.parse(v);
    return d && typeof d === "object" && Array.isArray(d.events) ? (d as TrackData) : null;
  } catch {
    return null;
  }
}

/** Kuaidi100-аас илгээмжийн явцыг татна — алдаанд throw хийхгүй, error талбартай буцаана.
 *  phone: YTO/SF г.м. нууцлалын шалгалттай курьерт хүлээн авагч/илгээгчийн утас (сүүлийн 4 орон хангалттай) */
export async function fetchTrack(com: string, no: string, phone = ""): Promise<TrackData> {
  const checked = new Date().toISOString().slice(0, 16).replace("T", " ");
  try {
    const r = await fetch(
      `https://www.kuaidi100.com/query?type=${encodeURIComponent(com)}&postid=${encodeURIComponent(no)}&phone=${encodeURIComponent(phone)}`,
      {
        headers: {
          Referer: "https://www.kuaidi100.com/",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );
    const d = (await r.json()) as { message?: string; state?: string; data?: TrackEvent[] };
    const events = Array.isArray(d.data)
      ? d.data.slice(0, 20).map((e) => ({ time: String(e.time || ""), context: String(e.context || "") }))
      : [];
    if (d.message !== "ok")
      return { state: "", events: [], checked, error: d.message || "Хариу уншигдсангүй" };
    // Олдоогүй дугаарт ч message:ok + ганц "查无结果" event ирдэг
    if (events.length === 0 || (events.length === 1 && events[0].context.includes("查无结果")))
      return {
        state: "",
        events: [],
        checked,
        error: phone
          ? "Мэдээлэл олдсонгүй — дугаар/утас зөв эсэхийг шалгана уу (дугаар шинэ бол дараа дахин оролдоорой)"
          : "Мэдээлэл олдсонгүй — YTO/SF бол хүлээн авагчийн утасны сүүлийн 4 оронг нэмж өгөөд дахин оролдоно уу",
      };
    return { state: String(d.state ?? ""), events, checked };
  } catch {
    return { state: "", events: [], checked, error: "Kuaidi100-тай холбогдож чадсангүй" };
  }
}
