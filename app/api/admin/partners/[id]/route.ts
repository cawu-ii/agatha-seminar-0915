import { NextRequest, NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { PartnerCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const CATEGORIES = new Set(Object.values(PartnerCategory));
const UPLOAD_PREFIX = "/uploads/partners";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // logoUrl is intentionally not accepted here - replacing it goes through
  // POST /api/admin/partners/:id/upload (openspec: add-speaker-partner-upload).
  const data: {
    name?: string;
    description?: string;
    category?: PartnerCategory;
  } = {};

  if (typeof body.name === "string") {
    const v = body.name.trim();
    if (!v) return NextResponse.json({ error: "名稱不可為空" }, { status: 400 });
    data.name = v;
  }
  if (typeof body.description === "string") {
    data.description = body.description.trim();
  }
  if (typeof body.category === "string") {
    if (!CATEGORIES.has(body.category as PartnerCategory)) {
      return NextResponse.json({ error: "分類須為主辦單位或協辦單位" }, { status: 400 });
    }
    data.category = body.category as PartnerCategory;
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
    const deleted = await prisma.partner.delete({ where: { id } });
    // Clean up the uploaded logo file too, not just the DB row - otherwise
    // deleting partners leaks files in public/uploads/partners/ forever
    // (openspec: add-speaker-partner-upload).
    if (deleted.logoUrl?.startsWith(UPLOAD_PREFIX)) {
      await unlink(path.join(process.cwd(), "public", deleted.logoUrl)).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/partners/:id] delete failed", err);
    return NextResponse.json({ error: "刪除失敗，請確認該筆夥伴仍存在" }, { status: 500 });
  }
}
