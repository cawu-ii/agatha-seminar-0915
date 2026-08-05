import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.agendaItem.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ items });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/agenda] query failed", err);
    return NextResponse.json(
      { error: "資料庫查詢失敗，請確認資料庫已初始化（npx prisma migrate dev）" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const timeLabel = typeof body.timeLabel === "string" ? body.timeLabel.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const speaker = typeof body.speaker === "string" && body.speaker.trim() ? body.speaker.trim() : null;
  const isBreak = body.isBreak === true;

  if (!timeLabel || !title) {
    return NextResponse.json({ error: "時間與標題為必填欄位" }, { status: 400 });
  }

  try {
    const last = await prisma.agendaItem.findFirst({ orderBy: { sortOrder: "desc" } });
    const sortOrder = (last?.sortOrder ?? 0) + 10;

    const created = await prisma.agendaItem.create({
      data: { timeLabel, title, speaker, isBreak, sortOrder },
    });
    return NextResponse.json({ item: created }, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/agenda] create failed", err);
    return NextResponse.json(
      { error: "新增失敗，請確認資料庫已初始化（npx prisma migrate dev）" },
      { status: 500 }
    );
  }
}
