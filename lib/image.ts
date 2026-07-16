// Зургийг браузер дээр багасгаж (хэт том хэмжээс + чанартай шахалт) upload-д бэлдэнэ.
// Ямар нэг алдаа гарвал эх файлаа буцаана — сервер талын 5MB шалгалт хамгаална.
// (Client талд л ажиллана — canvas ашигладаг.)

const MAX_DIM = 1600;
const QUALITY = 0.85;
// Үүнээс жижиг бөгөөд хэмжээс нь багтаж буй файлыг хөндөхгүй
const SKIP_BELOW = 700 * 1024;

export async function shrinkImageFile(file: File): Promise<File> {
  if (!file || file.size === 0) return file;
  if (!file.type.startsWith("image/")) return file;
  // GIF (хөдөлгөөнт) болон SVG-г canvas-аар дамжуулбал эвдэрнэ
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIM / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size <= SKIP_BELOW) {
      bmp.close();
      return file;
    }
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bmp.close();
      return file;
    }
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", QUALITY));
    // Шахаад томроод байвал (ховор) эх файлаа илгээнэ
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]*$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp" });
  } catch {
    return file;
  }
}

/** file input-д сонгогдсон зургуудыг багасгаж буцааж онооно */
export async function shrinkInputImages(input: HTMLInputElement): Promise<void> {
  const files = input.files;
  if (!files || files.length === 0) return;
  const dt = new DataTransfer();
  let changed = false;
  for (const f of Array.from(files)) {
    const s = await shrinkImageFile(f);
    if (s !== f) changed = true;
    dt.items.add(s);
  }
  if (changed) input.files = dt.files;
}
