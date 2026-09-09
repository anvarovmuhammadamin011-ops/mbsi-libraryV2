import { prisma } from "@/lib/db";

/**
 * Full processing pipeline for a book PDF:
 * 1. Extract text from the PDF
 * 2. Save extracted text
 * 3. Update BookContent status accordingly
 *
 * Used by the admin upload route, the books/[id] route and the
 * extract-all route so behavior stays consistent.
 */
export async function processBookExtraction(
  bookId: string,
  pdfKey: string
): Promise<{ status: string; textLength?: number }> {
  const { extractTextFromPdf } = await import("@/lib/server/text-extraction");

  await prisma.bookContent.upsert({
    where: { bookId },
    create: { bookId, status: "processing" },
    update: { status: "processing" },
  });

  try {
    const extraction = await extractTextFromPdf(pdfKey);
    const hasText = extraction.fullText.length > 50;

    if (!hasText) {
      await prisma.bookContent.update({
        where: { bookId },
        data: { extractedText: null, status: "needs_ocr" },
      });
      return { status: "needs_ocr" };
    }

    await prisma.bookContent.update({
      where: { bookId },
      data: { extractedText: extraction.fullText },
    });

    const data: { status: string } = { status: "completed" };
    await prisma.bookContent.update({ where: { bookId }, data });
    return { status: "completed", textLength: extraction.fullText.length };
  } catch (error: any) {
    await prisma.bookContent.update({
      where: { bookId },
      data: {
        status: "error",
        errorMessage: error.message || "Noma'lum xato",
      },
    });
    return { status: "error" };
  }
}