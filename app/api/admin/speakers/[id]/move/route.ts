import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Swaps sortOrder with the adjacent item - simple up/down reordering (see design.md: list is small, no drag-and-drop needed). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const direction = body.direction === "up" || body.direction === "down" ? body.direction : null;
  if (!direction) {
    return NextResponse.json({ error: "direction 須為 up 或 down" }, { status: 400 });
  }

  try {
    const speakers = await prisma.speaker.findMany({ orderBy: { sortOrder: "asc" } });
    const idx = speakers.findIndex((s) => s.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "找不到該筆講者" }, { status: 404 });
    }

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= speakers.length) {
      return NextResponse.json({ ok: true }); // already at the edge, no-op
    }

    const current = speakers[idx];
    const neighbor = speakers[swapIdx];
    await prisma.$transaction([
      prisma.speaker.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder } }),
      prisma.speaker.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/speakers/:id/move] failed", err);
    return NextResponse.json({ error: "排序失敗，請稍後再試" }, { status: 500 });
  }
}
