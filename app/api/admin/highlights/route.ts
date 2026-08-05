import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const highlights = await prisma.highlight.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ highlights });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/highlights] query failed", err);
    return NextResponse.json(
      { error: "資料庫查詢失敗，請確認資料庫已初始化（npx prisma migrate dev）" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const bodyText = typeof body.body === "string" ? body.body.trim() : "";

  if (!title || !bodyText) {
    return NextResponse.json({ error: "標題與內容為必填欄位" }, { status: 400 });
  }

  try {
    const last = await prisma.highlight.findFirst({ orderBy: { sortOrder: "desc" } });
    const sortOrder = (last?.sortOrder ?? 0) + 10;

    const created = await prisma.highlight.create({
      data: { title, body: bodyText, sortOrder },
    });
    return NextResponse.json({ highlight: created }, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/highlights] create failed", err);
    return NextResponse.json(
      { error: "新增失敗，請確認資料庫已初始化（npx prisma migrate dev）" },
      { status: 500 }
    );
  }
}
