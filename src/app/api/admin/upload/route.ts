import { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { savePdf, saveCover } from "@/lib/server/storage";
import { createBook } from "@/lib/server/books";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";

const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_COVER_BYTES = 5 * 1024 * 1024; // 5 MB

// Reads the PDF and returns its real page count. Falls back to
// `fallback` when parsing fails (corrupt or exotic PDF structure).
async function detectPageCount(buf: Buffer, fallback: number): Promise<number> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(buf),
      isEvalSupported: false,
      useSystemFonts: false,
    }).promise;
    const n = doc.numPages;
    await doc.destroy();
    return n > 0 ? n : fallback;
  } catch (err) {
    console.error("PDF page count detection failed:", err);
    return fallback;
  }
}

export async function POST(req: NextRequest) {
  const user = await requireRole("ADMIN");
  if (!user) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const coverFile = form.get("cover") as File | null;
  const title = String(form.get("title") || "").trim();
  const authorName = String(form.get("author") || "").trim();
  const description = String(form.get("description") || "").trim();
  const language = ["UZ", "RU", "EN"].includes(String(form.get("language")))
    ? String(form.get("language"))
    : "UZ";
  const categoryIdInput = String(form.get("categoryId") || "").trim();
  const newCategoryName = String(form.get("newCategory") || "").trim();
  const totalPages = Math.max(1, Number(form.get("totalPages")) || 1);
  const coinReward = Math.max(0, Math.min(1000, Number(form.get("coinReward")) || 10));
  const isPublished = String(form.get("isPublished") || "true") !== "false";

  if (!file || !title) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Sarlavha va PDF fayl kerak", 400);
  }
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    throw new ApiError(ERROR_CODES.INVALID_FILE, "Faqat PDF fayl", 400);
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new ApiError(ERROR_CODES.INVALID_FILE, "PDF hajmi 25 MB dan oshmasligi kerak", 400);
  }
  if (coverFile && coverFile.size > 0 && coverFile.size > MAX_COVER_BYTES) {
    throw new ApiError(ERROR_CODES.INVALID_FILE, "Muqova hajmi 5 MB dan oshmasligi kerak", 400);
  }

  // Resolve category: explicit new name wins, else selected id.
  let categoryId = categoryIdInput || null;
  if (newCategoryName) {
    const slug =
      newCategoryName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-") || `cat-${Date.now()}`;
    const existingCat = await prisma.category.findFirst({
      where: { name: newCategoryName },
    });
    categoryId = existingCat
      ? existingCat.id
      : (
          await prisma.category.create({
            data: { name: newCategoryName, slug },
          })
        ).id;
  }
  if (!categoryId) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Kategoriya tanlang yoki yangi nom yozing", 400);
  }

  // Resolve author (find by name, else create).
  let authorId: string;
  const existing = authorName
    ? await prisma.author.findFirst({ where: { name: authorName } })
    : null;
  if (existing) {
    authorId = existing.id;
  } else {
    const created = await prisma.author.create({
      data: { name: authorName || "Noma'lum" },
    });
    authorId = created.id;
  }

  const saved = await savePdf(file);
  let coverUrl: string | undefined;
  if (coverFile && coverFile.size > 0) {
    const savedCover = await saveCover(coverFile);
    coverUrl = savedCover.urlOrKey;
  }

  // Auto-detect the real page count from the PDF itself.
  const pdfBuffer = Buffer.from(await file.arrayBuffer());
  const detectedPages = await detectPageCount(pdfBuffer, totalPages);

  const book = await createBook({
    title,
    description,
    authorId,
    categoryId,
    language,
    isPublished,
    coverUrl,
    pdfUrl: saved.urlOrKey,
    totalPages: detectedPages,
    coinReward,
    fileSize: saved.size,
    userId: user.id,
  });

  return success(book, 201);
}

async function runExtractionBackground(bookId: string, pdfKey: string) {
  const { extractTextFromPdf } = await import("@/lib/server/text-extraction");
  const { translateToUzbek } = await import("@/lib/server/translation");
  const { analyzeBookContent, extractKeyTerms } = await import("@/lib/server/book-analysis");

  await prisma.bookContent.create({
    data: { bookId, status: "processing" },
  });

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
