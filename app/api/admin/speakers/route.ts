import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const speakers = await prisma.speaker.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ speakers });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/speakers] query failed", err);
    return NextResponse.json(
      { error: "資料庫查詢失敗，請確認資料庫已初始化（npx prisma migrate dev）" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const bio = typeof body.bio === "string" ? body.bio.trim() : "";
  const confirmed = body.confirmed !== false;

  if (!name || !title) {
    return NextResponse.json({ error: "姓名與職稱為必填欄位" }, { status: 400 });
  }

  try {
    const last = await prisma.speaker.findFirst({ orderBy: { sortOrder: "desc" } });
    const sortOrder = (last?.sortOrder ?? 0) + 10;

    // photoUrl starts null - it's set by POST /api/admin/speakers/:id/upload,
    // not pasted here (openspec: add-speaker-partner-upload).
    const created = await prisma.speaker.create({
      data: { name, title, bio, photoUrl: null, confirmed, sortOrder },
    });
    return NextResponse.json({ speaker: created }, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/speakers] create failed", err);
    return NextResponse.json(
      { error: "新增失敗，請確認資料庫已初始化（npx prisma migrate dev）" },
      { status: 500 }
    );
  }
}
