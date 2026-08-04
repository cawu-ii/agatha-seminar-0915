import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const utmSource = sp.get("utm_source") || undefined;
  const utmContent = sp.get("utm_content") || undefined;
  const dept = sp.get("dept") || undefined;
  const industry = sp.get("industry") || undefined;
  const reviewed = sp.get("reviewed");
  const q = sp.get("q")?.trim();

  const where: Prisma.RegistrationWhereInput = {
    ...(utmSource ? { utmSource } : {}),
    ...(utmContent ? { utmContent } : {}),
    ...(dept ? { dept } : {}),
    ...(industry ? { industry } : {}),
    ...(reviewed === "true" ? { reviewed: true } : {}),
    ...(reviewed === "false" ? { reviewed: false } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { company: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {}),
  };

  try {
    const registrations = await prisma.registration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        company: true,
        email: true,
        phone: true,
        dept: true,
        industry: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        utmContent: true,
        emailStatus: true,
        reviewed: true,
        reviewerNote: true,
        createdAt: true,
      },
      take: 500,
    });

    return NextResponse.json({ registrations });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/registrations] query failed", err);
    return NextResponse.json(
      { error: "資料庫查詢失敗，請確認資料庫已初始化（npx prisma migrate dev）" },
      { status: 500 }
    );
  }
}
