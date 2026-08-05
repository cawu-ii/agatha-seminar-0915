import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccount } from "@/lib/auth";
import { buildRegistrationsWorkbook, workbookToBuffer, exportFileName } from "@/lib/export-workbook";

// The in-/admin export button from CTO handoff doc v3 §6.3 ("後台可...一鍵匯出
// Excel"), gated by session role rather than a token since this is meant to be
// clicked from inside the browser, not scripted. PR-role sessions get 403 -
// same underlying data as /api/export, different authentication story.
export async function GET() {
  const me = await getCurrentAccount();
  if (!me || me.role !== "CTO") {
    return NextResponse.json({ error: "僅 CTO 可匯出" }, { status: 403 });
  }

  try {
    const registrations = await prisma.registration.findMany({ orderBy: { createdAt: "asc" } });
    const buffer = await workbookToBuffer(buildRegistrationsWorkbook(registrations));

    await prisma.adminAuditLog.create({
      data: { accountId: me.accountId, action: "export", detail: `${registrations.length} rows` },
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${exportFileName()}"`,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/export] failed", err);
    return NextResponse.json(
      { error: "匯出失敗，請確認資料庫已初始化（npx prisma migrate dev）" },
      { status: 500 }
    );
  }
}
