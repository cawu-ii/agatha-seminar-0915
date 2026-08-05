import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: {
    title?: string;
    body?: string;
  } = {};

  if (typeof body.title === "string") {
    const v = body.title.trim();
    if (!v) return NextResponse.json({ error: "標題不可為空" }, { status: 400 });
    data.title = v;
  }
  if (typeof body.body === "string") {
    const v = body.body.trim();
    if (!v) return NextResponse.json({ error: "內容不可為空" }, { status: 400 });
    data.body = v;
  }

  try {
    const updated = await prisma.highlight.update({ where: { id }, data });
    return NextResponse.json({ highlight: updated });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/highlights/:id] update failed", err);
    return NextResponse.json({ error: "更新失敗，請確認該筆亮點仍存在" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.highlight.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/highlights/:id] delete failed", err);
    return NextResponse.json({ error: "刪除失敗，請確認該筆亮點仍存在" }, { status: 500 });
  }
}
