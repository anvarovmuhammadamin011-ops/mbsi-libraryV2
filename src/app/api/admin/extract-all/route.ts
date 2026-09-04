import { route, json } from "@/lib/server/handler";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/db";

// Extract all books that have a PDF but no extracted text yet.
export const POST = route(async (req) => {
  const admin = await requireAdmin();

  const books = await prisma.book.findMany({
    where: {
      pdfUrl: { not: null },
      content: {
        is: null,
      },
    },
    select: { id: true, title: true, pdfUrl: true },
    take: 50,
  });

  if (books.length === 0) {
    return json({ success: true, data: { extracted: 0, skipped: 0, message: "Ajratish kerak bo'lgan kitob yo'q" } });
  }

  const results = [];
  for (const book of books) {
    try {
      await prisma.bookContent.upsert({
        where: { bookId: book.id },
        create: { bookId: book.id, status: "processing" },
        update: { status: "processing" },
      });

      const { extractTextFromPdf } = await import("@/lib/server/text-extraction");
      const extraction = await extractTextFromPdf(book.pdfUrl!);

      await prisma.bookContent.update({
        where: { bookId: book.id },
        data: {
          extractedText: extraction.fullText,
          status: "completed",
        },
      });

      results.push({ id: book.id, title: book.title, status: "completed", textLength: extraction.fullText.length });
    } catch (error: any) {
      await prisma.bookContent.update({
        where: { bookId: book.id },
        data: {
          status: "error",
          errorMessage: error.message || "Noma'lum xato",
        },
      });
      results.push({ id: book.id, title: book.title, status: "error", error: error.message });
    }
  }

  return json({
    success: true,
    data: {
      total: results.length,
      results,
    },
  });
});
