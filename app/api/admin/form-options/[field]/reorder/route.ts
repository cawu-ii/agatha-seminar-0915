import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFormOptionField } from "@/lib/form-options-db";

/** Sets sortOrder from a full ordered list of ids, scoped to one field - backs drag-and-drop reordering in the admin UI, replacing the old up/down move endpoint. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ field: string }> }) {
  const { field: rawField } = await params;
  const field = parseFormOptionField(rawField);
  if (!field) {
    return NextResponse.json({ error: "不明的欄位名稱" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const ids: string[] | null = Array.isArray(body.ids)
    ? body.ids.filter((id: unknown): id is string => typeof id === "string")
    : null;
  if (!ids || ids.length === 0) {
    return NextResponse.json({ error: "ids 為必填，需為字串陣列" }, { status: 400 });
  }

  try {
    await prisma.$transaction(
      ids.map((id, idx) => prisma.formOption.update({ where: { id }, data: { sortOrder: (idx + 1) * 10 } }))
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/form-options/:field/reorder] failed", err);
    return NextResponse.json({ error: "排序失敗，請重新整理後再試" }, { status: 500 });
  }
}
