import { NextResponse } from "next/server";
import db from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Admin талын шинэ захиалгын мэдэгдэлд — сүүлийн захиалгын id + хүлээгдэж буй тоо */
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const row = db
    .prepare(
      `SELECT COALESCE(MAX(id), 0) AS lastId,
              (SELECT COUNT(*) FROM orders WHERE status = 'pending') AS pending
       FROM orders`
    )
    .get() as { lastId: number; pending: number };
  return NextResponse.json(row);
}
