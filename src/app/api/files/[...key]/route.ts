import { NextRequest } from "next/server";
import { route } from "@/lib/server/handler";
import { prisma } from "@/lib/db";
import { sanitizeKey, usesS3, usesLocalFile } from "@/lib/server/storage";

function mimeFromKey(key: string): string {
  if (key.endsWith(".svg")) return "image/svg+xml";
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  if (key.endsWith(".gif")) return "image/gif";
  if (key.endsWith(".jpeg") || key.endsWith(".jpg")) return "image/jpeg";
  return "application/octet-stream";
}

// Serves public files (covers, images) stored in the database or S3.
// Private PDFs are NOT exposed here — they go through the signed
// /api/pdf/[id] route instead.
export const GET = route(async (req, ctx) => {
  const { key } = (await ctx.params) as { key: string[] };
  const raw = (key ?? []).join("/");
  const safe = sanitizeKey(decodeURIComponent(raw));
  if (safe.startsWith("pdfs/") || !safe.includes("/")) {
    return new Response("Not found", { status: 404 });
  }

  // S3/local driver yoqilgan bo'lsa — avval o'sha manbadan o'qib ko'ramiz
  if (usesS3() || usesLocalFile()) {
    const { readPrivate } = await import("@/lib/server/storage");
    try {
      const buf = await readPrivate(safe);
      if (buf) {
        return new Response(new Uint8Array(buf), {
          status: 200,
          headers: {
            "Content-Type": mimeFromKey(safe),
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    } catch {
      /* fall through to DB */
    }
  }

  const row = await prisma.storedFile.findUnique({ where: { key: safe } });
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(Buffer.from(row.data)), {
    status: 200,
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});
