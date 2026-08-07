import { NextRequest, NextResponse } from "next/server";
import { PartnerCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const CATEGORIES = new Set(Object.values(PartnerCategory));

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
  const category = CATEGORIES.has(body.category) ? (body.category as PartnerCategory) : PartnerCategory.COORGANIZER;

  if (!name) {
    return NextResponse.json({ error: "名稱為必填欄位" }, { status: 400 });
  }

  try {
    // sortOrder is scoped within the category (openspec: add-speaker-partner-upload) -
    // a new host and a new co-organizer both start at the end of their own group.
    const last = await prisma.partner.findFirst({ where: { category }, orderBy: { sortOrder: "desc" } });
    const sortOrder = (last?.sortOrder ?? 0) + 10;

    // logoUrl starts null - it's set by POST /api/admin/partners/:id/upload,
    // not pasted here (openspec: add-speaker-partner-upload).
    const created = await prisma.partner.create({
      data: { name, description, logoUrl: null, category, sortOrder },
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
