import { NextRequest, NextResponse } from "next/server";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { imageSize } from "image-size";
import { prisma } from "@/lib/prisma";

// Extends the Banner upload pattern (openspec: add-banner-event-info-cms) to
// speaker photos (openspec: add-speaker-partner-upload). Unlike Banner this
// is a minimum-size check, not an exact match (design.md Open Question #1,
// resolved 2026/08/07): any photo at least 520x520 is accepted.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "speakers");
const PUBLIC_PREFIX = "/uploads/speakers";
const MIN_SIZE = 520;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const existing = await prisma.speaker.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "找不到該筆講者，請確認已先建立講者資料" }, { status: 404 });
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
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "僅支援 JPEG／PNG／WebP 圖片格式" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  let dimensions: { width: number; height: number };
  try {
    dimensions = imageSize(bytes);
  } catch {
    return NextResponse.json({ error: "無法讀取圖片尺寸，檔案可能已損毀" }, { status: 400 });
  }

  // Minimum-size floor, not exact match - design.md Open Question #1.
  if (dimensions.width < MIN_SIZE || dimensions.height < MIN_SIZE) {
    return NextResponse.json(
      {
        error: `圖片尺寸過小：講者照片需至少 ${MIN_SIZE}×${MIN_SIZE}，收到的是 ${dimensions.width}×${dimensions.height}`,
      },
      { status: 400 }
    );
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const ext = EXT_BY_TYPE[file.type];
    const filename = `${id}-${Date.now()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    await writeFile(filePath, bytes);
    const publicUrl = `${PUBLIC_PREFIX}/${filename}`;

    const oldUrl = existing.photoUrl;
    const updated = await prisma.speaker.update({ where: { id }, data: { photoUrl: publicUrl } });

    // Immediate delete on replace, no versioning - design.md Open Question #4.
    if (oldUrl && oldUrl !== publicUrl && oldUrl.startsWith(PUBLIC_PREFIX)) {
      const oldPath = path.join(process.cwd(), "public", oldUrl);
      await unlink(oldPath).catch(() => {});
    }

    return NextResponse.json({ speaker: updated });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/speakers/:id/upload] upload failed", err);
    return NextResponse.json({ error: "上傳失敗，請稍後再試" }, { status: 500 });
  }
}
