import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const facts = await prisma.eventInfo.findMany({ orderBy: { field: "asc" } });
    return NextResponse.json({ facts });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/event-info] query failed", err);
    return NextResponse.json(
      { error: "資料庫查詢失敗，請確認資料庫已初始化（npx prisma migrate dev）" },
      { status: 500 }
    );
  }
}
