import { NextRequest, NextResponse } from "next/server";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { imageSize } from "image-size";
import { prisma } from "@/lib/prisma";

// Extends the Banner upload pattern (openspec: add-banner-event-info-cms) to
// partner logos (openspec: add-speaker-partner-upload). Validates PNG format
// and a minimum width only - no alpha-channel/transparency check (design.md
// Open Question #2, resolved 2026/08/07: format+width only).
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "partners");
const PUBLIC_PREFIX = "/uploads/partners";
const MIN_WIDTH = 800;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const existing = await prisma.partner.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "找不到該筆夥伴，請確認已先建立夥伴資料" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "無法解析上傳內容" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "請選擇要上傳的圖片檔案" }, { status: 400 });
  }
  if (file.type !== "image/png") {
    return NextResponse.json({ error: "Logo 僅支援 PNG 格式（建議使用透明背景）" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  let dimensions: { width: number; height: number };
  try {
    dimensions = imageSize(bytes);
  } catch {
    return NextResponse.json({ error: "無法讀取圖片尺寸，檔案可能已損毀" }, { status: 400 });
  }

  if (dimensions.width < MIN_WIDTH) {
    return NextResponse.json(
      { error: `圖片寬度過小：夥伴 Logo 需至少 ${MIN_WIDTH}px 寬，收到的是 ${dimensions.width}px` },
      { status: 400 }
    );
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${id}-${Date.now()}.png`;
    const filePath = path.join(UPLOAD_DIR, filename);
    await writeFile(filePath, bytes);
    const publicUrl = `${PUBLIC_PREFIX}/${filename}`;

    const oldUrl = existing.logoUrl;
    const updated = await prisma.partner.update({ where: { id }, data: { logoUrl: publicUrl } });

    // Immediate delete on replace, no versioning - design.md Open Question #4.
    if (oldUrl && oldUrl !== publicUrl && oldUrl.startsWith(PUBLIC_PREFIX)) {
      const oldPath = path.join(process.cwd(), "public", oldUrl);
      await unlink(oldPath).catch(() => {});
    }

    return NextResponse.json({ partner: updated });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/partners/:id/upload] upload failed", err);
    return NextResponse.json({ error: "上傳失敗，請稍後再試" }, { status: 500 });
  }
}
