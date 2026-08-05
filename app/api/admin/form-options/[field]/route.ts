import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFormOptionField } from "@/lib/form-options-db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ field: string }> }) {
  const { field: rawField } = await params;
  const field = parseFormOptionField(rawField);
  if (!field) {
    return NextResponse.json({ error: "不明的欄位名稱" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const value = typeof body.value === "string" ? body.value.trim() : "";
  if (!value) {
    return NextResponse.json({ error: "選項內容不可為空" }, { status: 400 });
  }

  try {
    const last = await prisma.formOption.findFirst({ where: { field }, orderBy: { sortOrder: "desc" } });
    const sortOrder = (last?.sortOrder ?? 0) + 10;

    const created = await prisma.formOption.create({
      data: { field, value, sortOrder },
    });
    return NextResponse.json({ option: created }, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/form-options/:field] create failed", err);
    return NextResponse.json({ error: "新增失敗，可能是這個選項已存在" }, { status: 500 });
  }
}
