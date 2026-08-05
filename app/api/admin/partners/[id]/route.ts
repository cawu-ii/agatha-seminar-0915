import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: {
    name?: string;
    description?: string;
    logoUrl?: string;
  } = {};

  if (typeof body.name === "string") {
    const v = body.name.trim();
    if (!v) return NextResponse.json({ error: "名稱不可為空" }, { status: 400 });
    data.name = v;
  }
  if (typeof body.description === "string") {
    data.description = body.description.trim();
  }
  if (typeof body.logoUrl === "string") {
    const v = body.logoUrl.trim();
    if (!v) return NextResponse.json({ error: "Logo 網址不可為空" }, { status: 400 });
    data.logoUrl = v;
  }

  try {
    const updated = await prisma.partner.update({ where: { id }, data });
    return NextResponse.json({ partner: updated });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/partners/:id] update failed", err);
    return NextResponse.json({ error: "更新失敗，請確認該筆夥伴仍存在" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.partner.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/partners/:id] delete failed", err);
    return NextResponse.json({ error: "刪除失敗，請確認該筆夥伴仍存在" }, { status: 500 });
  }
}
