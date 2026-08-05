import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkExportToken } from "@/lib/session";
import { buildRegistrationsWorkbook, workbookToBuffer, exportFileName } from "@/lib/export-workbook";

// CTO-only bulk export (data-export capability), token-authenticated for
// CLI/script use - kept separate from the session-based /api/admin/export so
// PR-role /admin sessions can never reach it (see admin-console spec).
export async function GET(req: NextRequest) {
  const token = req.headers.get("x-export-token") ?? req.nextUrl.searchParams.get("token") ?? "";
  if (!(await checkExportToken(token))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const registrations = await prisma.registration.findMany({ orderBy: { createdAt: "asc" } });
    const buffer = await workbookToBuffer(buildRegistrationsWorkbook(registrations));
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${exportFileName()}"`,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/export] query failed", err);
    return NextResponse.json(
      { error: "資料庫查詢失敗，請確認資料庫已初始化（npx prisma migrate dev）" },
      { status: 500 }
    );
  }
}
