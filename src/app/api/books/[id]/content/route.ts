import { route, json } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const GET = route(async (req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);

  if (!book.isPublished && user.role !== "ADMIN") {
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  }

  const content = await prisma.bookContent.findUnique({ where: { bookId: id } });
  if (!content) {
    return json({ success: true, data: null });
  }

  const url = new URL(req.url);
  const field = url.searchParams.get("field");

  if (field === "fullText") {
    return json({
      success: true,
      data: { text: content.extractedText },
    });
  }

  if (field === "translation") {
    return json({
      success: true,
      data: { text: content.translatedText },
    });
  }

  const images = (content as any).extractedImages as any[] | null;

  return json({
    success: true,
    data: {
      status: content.status,
      hasImages: !!images && images.length > 0,
      imageCount: images?.length || 0,
      summary: content.summary,
      keyPoints: content.keyPoints,
      highlights: content.highlights,
      tableOfContents: content.tableOfContents,
      keyTerms: content.keyTerms,
    },
  });
});
