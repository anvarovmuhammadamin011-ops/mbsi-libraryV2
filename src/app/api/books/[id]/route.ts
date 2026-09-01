import { route, json } from "@/lib/server/handler";
import { requireUser, requireAdmin } from "@/lib/server/auth";
import {
  getBookById,
  updateBook,
  deleteBook,
  setPublish,
} from "@/lib/server/books";
import { saveCover, savePdf, deleteCover, deletePrivate } from "@/lib/server/storage";
import { validatePdf, validateCover, countPdfPages } from "@/lib/server/pdf";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";
import { prisma } from "@/lib/db";

export const GET = route(async (req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const book = await getBookById(id);
  if (!book) throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);
  if (!book.isPublished && user.role !== "ADMIN") {
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  }
  return json({ success: true, data: book });
});

export const PATCH = route(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const form = await req.formData();

  const data: {
    title?: string;
    description?: string;
    authorId?: string;
    categoryId?: string;
    language?: string;
    isPublished?: boolean;
    coverUrl?: string;
    pdfUrl?: string;
    totalPages?: number;
    fileSize?: number;
    userId: string;
  } = { userId: admin.id };

  if (form.get("title") !== null) data.title = String(form.get("title"));
  if (form.get("description") !== null)
    data.description = String(form.get("description"));
  if (form.get("authorId")) data.authorId = String(form.get("authorId"));
  if (form.get("categoryId")) data.categoryId = String(form.get("categoryId"));
  if (form.get("language")) data.language = String(form.get("language"));
  if (form.get("isPublished") !== null)
    data.isPublished = form.get("isPublished") === "true";

  const existing = await prisma.book.findUnique({ where: { id } });
  if (!existing) throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);

  const coverFile = form.get("cover");
  if (coverFile instanceof File && coverFile.size > 0) {
    validateCover(Buffer.from(await coverFile.arrayBuffer()), coverFile.type, coverFile.name);
    const cover = await saveCover(coverFile);
    data.coverUrl = cover.urlOrKey;
    if (existing.coverUrl) await deleteCover(existing.coverUrl);
  }

  const pdfFile = form.get("pdf");
  let newPdfKey: string | undefined;
  if (pdfFile instanceof File && pdfFile.size > 0) {
    const buf = Buffer.from(await pdfFile.arrayBuffer());
    validatePdf(buf, pdfFile.type, pdfFile.name);
    const pdf = await savePdf(pdfFile);
    data.pdfUrl = pdf.urlOrKey;
    data.totalPages = countPdfPages(buf);
    data.fileSize = pdf.size;
    newPdfKey = pdf.urlOrKey;
    if (existing.pdfUrl) await deletePrivate(existing.pdfUrl);
  }

  const book = await updateBook(id, data);

  // Background: re-extract if new PDF uploaded
  if (newPdfKey) {
    runExtractionBackground(id, newPdfKey).catch((e) =>
      console.error("Auto-extract failed for", id, e)
    );
  }

  return json({ success: true, data: book });
});

export const DELETE = route(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const existing = await prisma.book.findUnique({ where: { id } });
  await deleteBook(id, admin.id);
  if (existing?.coverUrl) await deleteCover(existing.coverUrl);
  if (existing?.pdfUrl) await deletePrivate(existing.pdfUrl);
  return json({ success: true, data: { id } });
});

async function runExtractionBackground(bookId: string, pdfKey: string) {
  const { extractTextFromPdf } = await import("@/lib/server/text-extraction");
  const { translateToUzbek } = await import("@/lib/server/translation");
  const { analyzeBookContent, extractKeyTerms } = await import("@/lib/server/book-analysis");

  const existing = await prisma.bookContent.findUnique({ where: { bookId } });
  if (!existing) {
    await prisma.bookContent.create({ data: { bookId, status: "processing" } });
  } else {
    await prisma.bookContent.update({ where: { bookId }, data: { status: "processing" } });
  }

  try {
    const extraction = await extractTextFromPdf(pdfKey);
    await prisma.bookContent.update({
      where: { bookId },
      data: { extractedText: extraction.fullText },
    });

    const translation = await translateToUzbek(extraction.fullText);
    await prisma.bookContent.update({
      where: { bookId },
      data: { translatedText: translation.translatedText },
    });

    const [analysis, keyTerms] = await Promise.all([
      analyzeBookContent(extraction.fullText, extraction.pages),
      extractKeyTerms(extraction.fullText),
    ]);

    await prisma.bookContent.update({
      where: { bookId },
      data: {
        summary: analysis.summary,
        keyPoints: analysis.keyPoints,
        highlights: analysis.highlights,
        tableOfContents: analysis.tableOfContents,
        keyTerms: keyTerms,
        status: "completed",
      },
    });
  } catch (error: any) {
    await prisma.bookContent.update({
      where: { bookId },
      data: {
        status: "error",
        errorMessage: error.message || "Noma'lum xato",
      },
    });
  }
}
