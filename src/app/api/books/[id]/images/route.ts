import { route, json } from "@/lib/server/handler";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

/**
 * GET /api/books/:id/images?page=1&index=0
 * Returns a single extracted image's dataUrl for inline display.
 * Requires admin auth since the image data is stored in the DB.
 */
export const GET = route(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const index = parseInt(searchParams.get("index") || "0", 10);

  const content = await prisma.bookContent.findUnique({ where: { bookId: id } });
  if (!content) throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);

  const images = (content as any).extractedImages;
  if (!images || !Array.isArray(images)) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, "Rasmlar topilmadi", 404);
  }

  const img = images.find(
    (i: any) => i.page === page && i.index === index
  );
  if (!img) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, "Rasm topilmadi", 404);
  }

  return json({
    success: true,
    data: {
      dataUrl: img.dataUrl,
      width: img.width,
      height: img.height,
      caption: img.caption || null,
      page: img.page,
      index: img.index,
    },
  });
});
