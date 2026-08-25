import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

// Serves public files (covers, images) stored in the database.
// Private PDFs are NOT exposed here — they go through the signed
// /api/pdf/[id] route instead.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ key: string[] }> }) {
  const { key } = await ctx.params;
  const raw = (key ?? []).join("/");
  const safe = decodeURIComponent(raw).replace(/\\/g, "/").replace(/\.\.+/g, "");
  if (safe.startsWith("pdfs/") || !safe.includes("/")) {
    return new Response("Not found", { status: 404 });
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
}
