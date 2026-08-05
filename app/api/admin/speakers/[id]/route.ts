import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: {
    name?: string;
    title?: string;
    bio?: string;
    photoUrl?: string | null;
    confirmed?: boolean;
  } = {};

  if (typeof body.name === "string") {
    const v = body.name.trim();
    if (!v) return NextResponse.json({ error: "姓名不可為空" }, { status: 400 });
    data.name = v;
  }
  if (typeof body.title === "string") {
    const v = body.title.trim();
    if (!v) return NextResponse.json({ error: "職稱不可為空" }, { status: 400 });
    data.title = v;
  }
  if (typeof body.bio === "string") {
    data.bio = body.bio.trim();
  }
  if (typeof body.photoUrl === "string") {
    data.photoUrl = body.photoUrl.trim() || null;
  }
  if (typeof body.confirmed === "boolean") {
    data.confirmed = body.confirmed;
  }

  try {
    const updated = await prisma.speaker.update({ where: { id }, data });
    return NextResponse.json({ speaker: updated });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/speakers/:id] update failed", err);
    return NextResponse.json({ error: "更新失敗，請確認該筆講者仍存在" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.speaker.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/speakers/:id] delete failed", err);
    return NextResponse.json({ error: "刪除失敗，請確認該筆講者仍存在" }, { status: 500 });
  }
}
