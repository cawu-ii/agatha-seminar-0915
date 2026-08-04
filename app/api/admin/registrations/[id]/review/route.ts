import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reviewed = typeof body.reviewed === "boolean" ? body.reviewed : true;
  const reviewerNote = typeof body.reviewerNote === "string" ? body.reviewerNote : undefined;

  const updated = await prisma.registration.update({
    where: { id },
    data: { reviewed, ...(reviewerNote !== undefined ? { reviewerNote } : {}) },
  });

  return NextResponse.json({ id: updated.id, reviewed: updated.reviewed });
}
