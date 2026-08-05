import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Sets sortOrder from a full ordered list of ids - backs drag-and-drop reordering in the admin UI, replacing the old up/down move endpoint. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ids: string[] | null = Array.isArray(body.ids)
    ? body.ids.filter((id: unknown): id is string => typeof id === "string")
    : null;
  if (!ids || ids.length === 0) {
    return NextResponse.json({ error: "ids 為必填，需為字串陣列" }, { status: 400 });
  }

  try {
    await prisma.$transaction(
      ids.map((id, idx) => prisma.partner.update({ where: { id }, data: { sortOrder: (idx + 1) * 10 } }))
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/partners/reorder] failed", err);
    return NextResponse.json({ error: "排序失敗，請重新整理後再試" }, { status: 500 });
  }
}
