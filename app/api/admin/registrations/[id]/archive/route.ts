import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccount } from "@/lib/auth";

// CTO-only, reversible (openspec: add-cto-archive-registrations). Never
// calls prisma.registration.delete - this only ever flips a boolean, the
// row and all its data stay in the database regardless of archived state.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentAccount();
  if (!me) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }
  if (me.role !== "CTO") {
    return NextResponse.json({ error: "僅 CTO 可封存報名資料" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const archived = typeof body.archived === "boolean" ? body.archived : true;

  try {
    const updated = await prisma.registration.update({ where: { id }, data: { archived } });
    return NextResponse.json({ id: updated.id, archived: updated.archived });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/registrations/:id/archive] update failed", err);
    return NextResponse.json({ error: "更新失敗，請確認該筆報名資料仍存在" }, { status: 500 });
  }
}
