import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const options = await prisma.formOption.findMany({ orderBy: [{ field: "asc" }, { sortOrder: "asc" }] });
    return NextResponse.json({ options });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/form-options] query failed", err);
    return NextResponse.json(
      { error: "資料庫查詢失敗，請確認資料庫已初始化（npx prisma migrate dev）" },
      { status: 500 }
    );
  }
}
