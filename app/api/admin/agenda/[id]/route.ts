import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: {
    timeLabel?: string;
    title?: string;
    speaker?: string | null;
    isBreak?: boolean;
  } = {};

  if (typeof body.timeLabel === "string") {
    const v = body.timeLabel.trim();
    if (!v) return NextResponse.json({ error: "時間不可為空" }, { status: 400 });
    data.timeLabel = v;
  }
  if (typeof body.title === "string") {
    const v = body.title.trim();
    if (!v) return NextResponse.json({ error: "標題不可為空" }, { status: 400 });
    data.title = v;
  }
  if (typeof body.speaker === "string") {
    data.speaker = body.speaker.trim() || null;
  }
  if (typeof body.isBreak === "boolean") {
    data.isBreak = body.isBreak;
  }

  try {
    const updated = await prisma.agendaItem.update({ where: { id }, data });
    return NextResponse.json({ item: updated });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/agenda/:id] update failed", err);
    return NextResponse.json({ error: "更新失敗，請確認該筆議程仍存在" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.agendaItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/agenda/:id] delete failed", err);
    return NextResponse.json({ error: "刪除失敗，請確認該筆議程仍存在" }, { status: 500 });
  }
}
