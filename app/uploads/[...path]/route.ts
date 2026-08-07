import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Serves everything under public/uploads/ through a route handler instead of
// relying on Next.js's built-in public-folder static serving.
//
// Found in production (2026/08/07): `next start` appears to snapshot which
// files exist under public/ at server startup and does not discover files
// written there at runtime by the upload routes (banner/speakers/partners) -
// newly uploaded files 404 (with Next's cached not-found-page response,
// confirmed via response headers) until the process is restarted. This
// route handler reads the filesystem fresh on every request instead, so
// uploads work immediately without requiring a pm2 restart.
const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  // Reject path traversal / null bytes before touching the filesystem.
  if (segments.some((s) => s.includes("..") || s.includes("\0"))) {
    return NextResponse.json({ error: "無效路徑" }, { status: 400 });
  }

  const resolved = path.resolve(UPLOAD_ROOT, ...segments);
  if (!resolved.startsWith(UPLOAD_ROOT + path.sep)) {
    return NextResponse.json({ error: "無效路徑" }, { status: 400 });
  }

  const contentType = MIME_BY_EXT[path.extname(resolved).toLowerCase()];
  if (!contentType) {
    return NextResponse.json({ error: "不支援的檔案類型" }, { status: 400 });
  }

  try {
    const bytes = await readFile(resolved);
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "找不到檔案" }, { status: 404 });
  }
}
