import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentAccount } from "@/lib/auth";

export async function GET() {
  const me = await getCurrentAccount();
  if (!me || me.role !== "CTO") {
    return NextResponse.json({ error: "僅 CTO 可管理帳號" }, { status: 403 });
  }

  try {
    const accounts = await prisma.adminAccount.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true, lastLoginAt: true },
    });
    return NextResponse.json({ accounts });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/accounts] query failed", err);
    return NextResponse.json({ error: "查詢失敗" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const me = await getCurrentAccount();
  if (!me || me.role !== "CTO") {
    return NextResponse.json({ error: "僅 CTO 可管理帳號" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role === "CTO" ? "CTO" : "PR";

  if (!email || !name || !password) {
    return NextResponse.json({ error: "Email、姓名、密碼為必填欄位" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "密碼至少 8 個字元" }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const account = await prisma.adminAccount.create({
      data: { email, name, passwordHash, role },
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    });
    return NextResponse.json({ account });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/accounts] create failed", err);
    return NextResponse.json({ error: "新增失敗，Email 可能已被使用" }, { status: 500 });
  }
}
