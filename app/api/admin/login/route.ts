import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, COOKIE_NAME, SESSION_TTL_MS } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "請輸入 Email 與密碼" }, { status: 400 });
  }

  try {
    const account = await prisma.adminAccount.findUnique({ where: { email } });
    if (!account || !account.active) {
      return NextResponse.json({ error: "帳號或密碼錯誤" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, account.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "帳號或密碼錯誤" }, { status: 401 });
    }

    const token = await createSessionToken(account.id, account.role);

    await prisma.$transaction([
      prisma.adminAccount.update({ where: { id: account.id }, data: { lastLoginAt: new Date() } }),
      prisma.adminAuditLog.create({ data: { accountId: account.id, action: "login" } }),
    ]);

    const res = NextResponse.json({ ok: true, role: account.role });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    });
    return res;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/login] failed", err);
    return NextResponse.json(
      { error: "登入失敗，請確認資料庫已初始化（npx prisma migrate dev && npm run seed:admin）" },
      { status: 500 }
    );
  }
}
