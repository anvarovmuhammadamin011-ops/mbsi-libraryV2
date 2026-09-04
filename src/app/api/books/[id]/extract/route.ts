import { route, json } from "@/lib/server/handler";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";
import { extractTextFromPdf } from "@/lib/server/text-extraction";

export const POST = route(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);
  if (!book.pdfUrl) throw new ApiError(ERROR_CODES.VALIDATION, "Kitobda PDF fayl yo'q", 400);

  let content = await prisma.bookContent.findUnique({ where: { bookId: id } });
  if (!content) {
    content = await prisma.bookContent.create({
      data: { bookId: id, status: "processing" },
    });
  } else {
    await prisma.bookContent.update({
      where: { bookId: id },
      data: { status: "processing" },
    });
  }

  try {
    const extraction = await extractTextFromPdf(book.pdfUrl);
    await prisma.bookContent.update({
      where: { bookId: id },
      data: {
        extractedText: extraction.fullText,
        status: "completed",
      },
    });

    return json({
      success: true,
      data: {
        status: "completed",
        textLength: extraction.fullText.length,
      },
    });
  } catch (error: any) {
    await prisma.bookContent.update({
      where: { bookId: id },
      data: {
        status: "error",
        errorMessage: error.message || "Noma'lum xato",
      },
    });
    throw error;
  }
});

export const GET = route(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;

  const content = await prisma.bookContent.findUnique({ where: { bookId: id } });
  if (!content) {
    return json({ success: true, data: null });
  }

  return json({
    success: true,
    data: {
      status: content.status,
      hasText: !!content.extractedText,
      hasTranslation: !!content.translatedText,
      hasAnalysis: !!content.summary,
      textLength: content.extractedText?.length ?? 0,
      extractedText: content.extractedText?.substring(0, 500),
      translatedText: content.translatedText?.substring(0, 500),
      summary: content.summary,
      keyPoints: content.keyPoints,
      highlights: content.highlights,
      tableOfContents: content.tableOfContents,
      keyTerms: content.keyTerms,
      errorMessage: content.errorMessage,
    },
  });
});
