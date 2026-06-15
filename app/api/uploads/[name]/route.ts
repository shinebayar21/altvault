import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  // path traversal хамгаалалт
  const safe = path.basename(name);
  const file = path.join(process.cwd(), "data", "uploads", safe);
  if (!fs.existsSync(file)) return new NextResponse("Not found", { status: 404 });
  const ext = safe.split(".").pop()?.toLowerCase() || "";
  const buf = fs.readFileSync(file);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
