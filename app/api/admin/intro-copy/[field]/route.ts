import { NextRequest, NextResponse } from "next/server";
import { IntroCopyField } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// PATCH only - no POST/DELETE. There are always exactly 2 blocks (LEAD/
// ATTENDEE); admin edits a slot's content, never adds/removes a slot
// (design.md: fixed-slot content, same reasoning as EventInfo).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ field: string }> }) {
  const { field: rawField } = await params;
  const field = (Object.values(IntroCopyField) as string[]).includes(rawField)
    ? (rawField as IntroCopyField)
    : null;
  if (!field) {
    return NextResponse.json({ error: "不明的欄位名稱" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  if (typeof body.body !== "string" || !body.body.trim()) {
    return NextResponse.json({ error: "內文不可為空" }, { status: 400 });
  }

  try {
    const updated = await prisma.introCopy.update({ where: { field }, data: { body: body.body.trim() } });
    return NextResponse.json({ block: updated });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/intro-copy/:field] update failed", err);
    return NextResponse.json({ error: "更新失敗，請確認資料庫已初始化並已執行 seed:intro-copy" }, { status: 500 });
  }
}
