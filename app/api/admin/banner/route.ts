import { NextRequest, NextResponse } from "next/server";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { imageSize } from "image-size";
import { prisma } from "@/lib/prisma";

// This project's first real file upload (openspec: add-banner-event-info-cms).
// Stored on local disk under public/uploads/banner/ - this app already runs
// on a single EC2 instance with persistent disk (see DEPLOYMENT.md), the
// same reason the SQLite file lives there; no cloud storage dependency is
// needed or justified for a single-event microsite.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "banner");
const PUBLIC_PREFIX = "/uploads/banner";

const SLOTS = {
  desktop: { width: 2560, height: 1440, field: "desktopUrl" as const },
  mobile: { width: 1080, height: 1350, field: "mobileUrl" as const },
};

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function GET() {
  try {
    const banner = await prisma.banner.findUnique({ where: { id: "singleton" } });
    return NextResponse.json({ banner });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/banner] query failed", err);
    return NextResponse.json(
      { error: "資料庫查詢失敗，請確認資料庫已初始化（npx prisma migrate dev）" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "無法解析上傳內容" }, { status: 400 });
  }

  const slotKey = form.get("slot");
  if (slotKey !== "desktop" && slotKey !== "mobile") {
    return NextResponse.json({ error: "slot 須為 desktop 或 mobile" }, { status: 400 });
  }
  const slot = SLOTS[slotKey];

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

  // Hard reject on dimension mismatch - confirmed decision, design.md.
  if (dimensions.width !== slot.width || dimensions.height !== slot.height) {
    return NextResponse.json(
      {
        error: `圖片尺寸不符：${slotKey === "desktop" ? "桌機版" : "手機版"} Banner 需為 ${slot.width}×${slot.height}，收到的是 ${dimensions.width}×${dimensions.height}`,
      },
      { status: 400 }
    );
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const ext = EXT_BY_TYPE[file.type];
    const filename = `${slotKey}-${Date.now()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    await writeFile(filePath, bytes);
    const publicUrl = `${PUBLIC_PREFIX}/${filename}`;

    const existing = await prisma.banner.findUnique({ where: { id: "singleton" } });
    const oldUrl = existing?.[slot.field];

    const banner = await prisma.banner.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", [slot.field]: publicUrl },
      update: { [slot.field]: publicUrl },
    });

    // Delete old file immediately on replace, no rollback copy - confirmed
    // decision, design.md (avoids unbounded disk growth on a box with no
    // backup mechanism yet).
    if (oldUrl && oldUrl !== publicUrl) {
      const oldPath = path.join(process.cwd(), "public", oldUrl);
      await unlink(oldPath).catch(() => {});
    }

    return NextResponse.json({ banner });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/admin/banner] upload failed", err);
    return NextResponse.json({ error: "上傳失敗，請稍後再試" }, { status: 500 });
  }
}
