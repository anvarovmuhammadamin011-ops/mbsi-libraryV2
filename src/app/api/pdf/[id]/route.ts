import { route } from "@/lib/server/handler";
import { getSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { readPrivate } from "@/lib/server/storage";
import { verifyPdfAccess } from "@/lib/server/storage";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

// Secure, signed PDF delivery. The URL is signed (HMAC) and the
// file lives outside /public so it is never directly accessible.
// Access is also gated by authentication + book publish state,
// matching the future S3 "signed URL" architecture.
export const GET = route(async (req, ctx) => {
  const user = await getSessionUser();
  if (!user) throw new ApiError(ERROR_CODES.UNAUTHORIZED, "Tizimga kiring", 401);

  const { id } = await ctx.params;
  const expires = req.nextUrl.searchParams.get("expires") ?? "";
  const sig = req.nextUrl.searchParams.get("sig") ?? "";
  if (!verifyPdfAccess(id, expires, sig)) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Yaroqsiz yoki muddati o'tgan havolа", 403);
  }

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book || !book.pdfUrl) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, "PDF topilmadi", 404);
  }
  if (!book.isPublished && user.role !== "ADMIN") {
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  }

  const buffer = await readPrivate(book.pdfUrl);
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=\"book.pdf\"",
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
});
