import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkExportToken } from "@/lib/session";

// CTO-only bulk export (data-export capability). Authenticated separately from
// /admin's ADMIN_PASSWORD/session cookie on purpose - PR's shared password must
// never reach this route, and it is not linked anywhere in the /admin UI.
export async function GET(req: NextRequest) {
  const token = req.headers.get("x-export-token") ?? req.nextUrl.searchParams.get("token") ?? "";
  if (!(await checkExportToken(token))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const registrations = await prisma.registration.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({ registrations });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/export] query failed", err);
    return NextResponse.json(
      { error: "資料庫查詢失敗，請確認資料庫已初始化（npx prisma migrate dev）" },
      { status: 500 }
    );
  }
}
