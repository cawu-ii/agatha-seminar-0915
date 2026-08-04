import { NextResponse } from "next/server";
import { sendConfirmationEmail } from "@/lib/integrations/email";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await sendConfirmationEmail(id);
  return NextResponse.json({ ok: true });
}
