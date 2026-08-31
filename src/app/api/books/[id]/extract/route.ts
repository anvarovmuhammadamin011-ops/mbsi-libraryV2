import { route, json } from "@/lib/server/handler";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";
import { extractTextFromPdf } from "@/lib/server/text-extraction";
import { translateToUzbek } from "@/lib/server/translation";
import { analyzeBookContent, generateBookSummary, extractKeyTerms } from "@/lib/server/book-analysis";

export const POST = route(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);
  if (!book.pdfUrl) throw new ApiError(ERROR_CODES.VALIDATION, "Kitobda PDF fayl yo'q", 400);

  const body = await req.json().catch(() => ({}));
  const action = body.action as "extract" | "translate" | "analyze" | "all";

  let content = await prisma.bookContent.findUnique({ where: { bookId: id } });
  if (!content) {
    content = await prisma.bookContent.create({
      data: { bookId: id, status: "processing" },
    });
  }

  try {
    await prisma.bookContent.update({
      where: { bookId: id },
      data: { status: "processing" },
    });

    if (action === "extract" || action === "all") {
      const extraction = await extractTextFromPdf(book.pdfUrl);
      await prisma.bookContent.update({
        where: { bookId: id },
        data: { extractedText: extraction.fullText },
      });
      content.extractedText = extraction.fullText;
    }

    if (action === "translate" || action === "all") {
      const textToTranslate = content.extractedText;
      if (!textToTranslate) {
        throw new ApiError(ERROR_CODES.VALIDATION, "Avval matnni ajrating", 400);
      }
      const translation = await translateToUzbek(textToTranslate);
      await prisma.bookContent.update({
        where: { bookId: id },
        data: { translatedText: translation.translatedText },
      });
      content.translatedText = translation.translatedText;
    }

    if (action === "analyze" || action === "all") {
      const textToAnalyze = content.extractedText || content.translatedText;
      if (!textToAnalyze) {
        throw new ApiError(ERROR_CODES.VALIDATION, "Avval matnni ajrating", 400);
      }

      const [analysis, keyTerms] = await Promise.all([
        analyzeBookContent(textToAnalyze, []),
        extractKeyTerms(textToAnalyze),
      ]);

      await prisma.bookContent.update({
        where: { bookId: id },
        data: {
          summary: analysis.summary,
          keyPoints: analysis.keyPoints,
          highlights: analysis.highlights,
          tableOfContents: analysis.tableOfContents,
          keyTerms: keyTerms,
        },
      });

      content.summary = analysis.summary;
      content.keyPoints = analysis.keyPoints as any;
      content.highlights = analysis.highlights as any;
      content.tableOfContents = analysis.tableOfContents as any;
      content.keyTerms = keyTerms as any;
    }

    await prisma.bookContent.update({
      where: { bookId: id },
      data: { status: "completed" },
    });

    return json({
      success: true,
      data: {
        status: "completed",
        hasText: !!content.extractedText,
        hasTranslation: !!content.translatedText,
        hasAnalysis: !!content.summary,
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
