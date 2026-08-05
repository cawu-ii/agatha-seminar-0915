import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const partners = await prisma.partner.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ partners });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/partners] query failed", err);
    return NextResponse.json(
      { error: "資料庫查詢失敗，請確認資料庫已初始化（npx prisma migrate dev）" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const logoUrl = typeof body.logoUrl === "string" ? body.logoUrl.trim() : "";

  if (!name || !logoUrl) {
    return NextResponse.json({ error: "名稱與 Logo 網址為必填欄位" }, { status: 400 });
  }

  try {
    const last = await prisma.partner.findFirst({ orderBy: { sortOrder: "desc" } });
    const sortOrder = (last?.sortOrder ?? 0) + 10;

    const created = await prisma.partner.create({
      data: { name, description, logoUrl, sortOrder },
    });
    return NextResponse.json({ partner: created }, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/partners] create failed", err);
    return NextResponse.json(
      { error: "新增失敗，請確認資料庫已初始化（npx prisma migrate dev）" },
      { status: 500 }
    );
  }
}
