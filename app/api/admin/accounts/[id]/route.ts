import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentAccount } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentAccount();
  if (!me || me.role !== "CTO") {
    return NextResponse.json({ error: "僅 CTO 可管理帳號" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: { active?: boolean; passwordHash?: string } = {};
  if (typeof body.active === "boolean") {
    data.active = body.active;
  }
  if (typeof body.newPassword === "string" && body.newPassword) {
    if (body.newPassword.length < 8) {
      return NextResponse.json({ error: "密碼至少 8 個字元" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(body.newPassword, 10);
  }

  try {
    const account = await prisma.adminAccount.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, active: true },
    });
    return NextResponse.json({ account });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/accounts/:id] update failed", err);
    return NextResponse.json({ error: "更新失敗，請確認該帳號仍存在" }, { status: 500 });
  }
}
