import { NextRequest, NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";

const UPLOAD_PREFIX = "/uploads/speakers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // photoUrl is intentionally not accepted here - replacing it goes through
  // POST /api/admin/speakers/:id/upload (openspec: add-speaker-partner-upload).
  const data: {
    name?: string;
    title?: string;
    bio?: string;
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
    const deleted = await prisma.speaker.delete({ where: { id } });
    // Clean up the uploaded photo file too, not just the DB row - otherwise
    // deleting speakers leaks files in public/uploads/speakers/ forever
    // (openspec: add-speaker-partner-upload).
    if (deleted.photoUrl?.startsWith(UPLOAD_PREFIX)) {
      await unlink(path.join(process.cwd(), "public", deleted.photoUrl)).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/speakers/:id] delete failed", err);
    return NextResponse.json({ error: "刪除失敗，請確認該筆講者仍存在" }, { status: 500 });
  }
}
