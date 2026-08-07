import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAccount } from "@/lib/auth";
import { buildRegistrationsWorkbook, workbookToBuffer, exportFileName } from "@/lib/export-workbook";

// The in-/admin export button from CTO handoff doc v3 §6.3 ("後台可...一鍵匯出
// Excel"). Originally CTO-only per handoff doc §6.9 ("全量含個資之名單匯出由我方
// 控管後再提供"); opened to PR-role sessions too on 2026/08/07 per direct user
// instruction (openspec: open-export-to-pr-role) - PR needs to export directly
// to hand lists to registering companies. Still requires a valid session at
// all; every export is still attributed via AdminAuditLog below regardless
// of role, so this only removes the role restriction, not accountability.
export async function GET() {
  const me = await getCurrentAccount();
  if (!me) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
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
