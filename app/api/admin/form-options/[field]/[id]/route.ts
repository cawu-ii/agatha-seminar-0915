import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFormOptionField } from "@/lib/form-options-db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ field: string; id: string }> }) {
  const { field: rawField, id } = await params;
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
    const updated = await prisma.formOption.update({ where: { id }, data: { value } });
    return NextResponse.json({ option: updated });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/form-options/:field/:id] update failed", err);
    return NextResponse.json({ error: "更新失敗，請確認該選項仍存在，或此名稱已被使用" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ field: string; id: string }> }) {
  const { field: rawField, id } = await params;
  const field = parseFormOptionField(rawField);
  if (!field) {
    return NextResponse.json({ error: "不明的欄位名稱" }, { status: 400 });
  }

  try {
    // A field must always have at least one option - z.enum() requires a
    // non-empty tuple, so an empty field would break registration validation
    // (see design.md).
    const count = await prisma.formOption.count({ where: { field } });
    if (count <= 1) {
      return NextResponse.json({ error: "此欄位至少要保留一個選項，無法刪除最後一個" }, { status: 400 });
    }

    await prisma.formOption.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/form-options/:field/:id] delete failed", err);
    return NextResponse.json({ error: "刪除失敗，請確認該選項仍存在" }, { status: 500 });
  }
}
