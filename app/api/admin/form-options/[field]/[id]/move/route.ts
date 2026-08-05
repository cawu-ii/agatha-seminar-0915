import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFormOptionField } from "@/lib/form-options-db";

/** Swaps sortOrder with the adjacent item within the same field - simple up/down reordering (see design.md: list is small, no drag-and-drop needed). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ field: string; id: string }> }) {
  const { field: rawField, id } = await params;
  const field = parseFormOptionField(rawField);
  if (!field) {
    return NextResponse.json({ error: "不明的欄位名稱" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const direction = body.direction === "up" || body.direction === "down" ? body.direction : null;
  if (!direction) {
    return NextResponse.json({ error: "direction 須為 up 或 down" }, { status: 400 });
  }

  try {
    const options = await prisma.formOption.findMany({ where: { field }, orderBy: { sortOrder: "asc" } });
    const idx = options.findIndex((o) => o.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "找不到該選項" }, { status: 404 });
    }

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= options.length) {
      return NextResponse.json({ ok: true }); // already at the edge, no-op
    }

    const current = options[idx];
    const neighbor = options[swapIdx];
    await prisma.$transaction([
      prisma.formOption.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder } }),
      prisma.formOption.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/form-options/:field/:id/move] failed", err);
    return NextResponse.json({ error: "排序失敗，請稍後再試" }, { status: 500 });
  }
}
