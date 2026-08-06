import { NextRequest, NextResponse } from "next/server";
import { EventInfoField } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// PATCH only - no POST/DELETE. There are always exactly 4 facts (Date/Time/
// Venue/Access); admin edits a slot's content, never adds/removes a slot
// (design.md: fixed-slot content, same reasoning as Banner's singleton).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ field: string }> }) {
  const { field: rawField } = await params;
  const field = (Object.values(EventInfoField) as string[]).includes(rawField)
    ? (rawField as EventInfoField)
    : null;
  if (!field) {
    return NextResponse.json({ error: "不明的欄位名稱" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const data: { line1?: string; line2?: string | null; subText?: string | null } = {};

  if (typeof body.line1 === "string") {
    const v = body.line1.trim();
    if (!v) return NextResponse.json({ error: "主要內容不可為空" }, { status: 400 });
    data.line1 = v;
  }
  if (typeof body.line2 === "string") {
    data.line2 = body.line2.trim() || null;
  }
  if (typeof body.subText === "string") {
    data.subText = body.subText.trim() || null;
  }

  try {
    const updated = await prisma.eventInfo.update({ where: { field }, data });
    return NextResponse.json({ fact: updated });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/event-info/:field] update failed", err);
    return NextResponse.json({ error: "更新失敗，請確認資料庫已初始化並已執行 seed:event-info" }, { status: 500 });
  }
}
