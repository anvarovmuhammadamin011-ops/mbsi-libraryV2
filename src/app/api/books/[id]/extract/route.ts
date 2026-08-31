import { route, json } from "@/lib/server/handler";
import { requireAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";
import { extractTextFromPdf } from "@/lib/server/text-extraction";
import { translateToUzbek } from "@/lib/server/translation";
import { analyzeBookContent, extractKeyTerms } from "@/lib/server/book-analysis";
import {
  extractImagesFromPdf,
  pixelsToPngDataUrl,
  captionImage,
  type ExtractedImage,
} from "@/lib/server/image-extraction";

type ExtractAction = "extract" | "translate" | "analyze" | "images" | "all";

/**
 * Insert [IMAGE:P:i] markers into translated text so images reappear
 * in roughly the right positions. We split the original text by page,
 * find where each page boundary falls in the translation, and insert
 * the marker for that page's images after the corresponding chunk.
 */
function insertImageMarkers(
  translatedText: string,
  images: ExtractedImage[],
  totalPages: number
): string {
  if (images.length === 0) return translatedText;

  // Group images by page
  const byPage = new Map<number, ExtractedImage[]>();
  for (const img of images) {
    const list = byPage.get(img.page) || [];
    list.push(img);
    byPage.set(img.page, list);
  }

  // Split translated text into roughly equal chunks by page
  const paragraphs = translatedText.split(/\n\n+/);
  const totalChars = translatedText.length;
  const charsPerPage = totalChars / totalPages;

  const result: string[] = [];
  let currentOffset = 0;

  for (let page = 1; page <= totalPages; page++) {
    const pageImages = byPage.get(page);
    if (pageImages && pageImages.length > 0) {
      // Find the paragraph closest to this page's expected position
      const expectedPos = page * charsPerPage;
      let bestIdx = 0;
      let bestDist = Infinity;
      let accChars = 0;

      for (let p = 0; p < paragraphs.length; p++) {
        accChars += paragraphs[p].length + 2; // +2 for \n\n
        if (p >= currentOffset) {
          const dist = Math.abs(accChars - expectedPos);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = p;
          }
        }
      }

      // Insert markers after the best paragraph
      const insertAt = Math.min(bestIdx + 1, paragraphs.length);
      const before = paragraphs.slice(currentOffset, insertAt);
      const markers = pageImages.map((img) => `[IMAGE:${img.page}:${img.index}]`).join("\n");

      result.push(before.join("\n\n"));
      result.push(markers);

      currentOffset = insertAt;
    }
  }

  // Append remaining paragraphs
  if (currentOffset < paragraphs.length) {
    result.push(paragraphs.slice(currentOffset).join("\n\n"));
  }

  return result.join("\n\n");
}

export const POST = route(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);
  if (!book.pdfUrl) throw new ApiError(ERROR_CODES.VALIDATION, "Kitobda PDF fayl yo'q", 400);

  const body = await req.json().catch(() => ({}));
  const action = body.action as ExtractAction;

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

    // ── Extract text ──
    if (action === "extract" || action === "all") {
      const extraction = await extractTextFromPdf(book.pdfUrl);
      await prisma.bookContent.update({
        where: { bookId: id },
        data: { extractedText: extraction.fullText },
      });
      content.extractedText = extraction.fullText;
    }

    // ── Extract images ──
    if (action === "images" || action === "all") {
      const images = await extractImagesFromPdf(book.pdfUrl, {
        minSize: 20,
        maxImages: 50,
      });

      // Convert raw pixel data to PNG data URLs where needed
      const processedImages: ExtractedImage[] = [];
      for (const img of images) {
        let dataUrl = img.dataUrl;
        if (!dataUrl.startsWith("data:")) {
          // Raw pixel data — convert to PNG
          const bytes = Uint8Array.from(atob(dataUrl), (c) =>
            c.charCodeAt(0)
          );
          dataUrl = await pixelsToPngDataUrl(bytes, img.width, img.height);
        }
        processedImages.push({ ...img, dataUrl });
      }

      await prisma.bookContent.update({
        where: { bookId: id },
        data: { extractedImages: processedImages as any },
      });
      (content as any).extractedImages = processedImages;
    }

    // ── Translate with image markers ──
    if (action === "translate" || action === "all") {
      const textToTranslate = content.extractedText;
      if (!textToTranslate) {
        throw new ApiError(ERROR_CODES.VALIDATION, "Avval matnni ajrating", 400);
      }
      const translation = await translateToUzbek(textToTranslate);

      // If images were extracted, insert markers into translated text
      const images: ExtractedImage[] =
        (content as any).extractedImages || [];
      let finalTranslation = translation.translatedText;
      if (images.length > 0) {
        finalTranslation = insertImageMarkers(
          translation.translatedText,
          images,
          book.totalPages || 1
        );
      }

      await prisma.bookContent.update({
        where: { bookId: id },
        data: { translatedText: finalTranslation },
      });
      content.translatedText = finalTranslation;
    }

    // ── Analyze (highlights, summary, key terms) ──
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

    const images: ExtractedImage[] =
      (content as any).extractedImages || [];

    return json({
      success: true,
      data: {
        status: "completed",
        hasText: !!content.extractedText,
        hasTranslation: !!content.translatedText,
        hasAnalysis: !!content.summary,
        hasImages: images.length > 0,
        imageCount: images.length,
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

  const images = (content as any).extractedImages as ExtractedImage[] | null;

  return json({
    success: true,
    data: {
      status: content.status,
      hasText: !!content.extractedText,
      hasTranslation: !!content.translatedText,
      hasAnalysis: !!content.summary,
      hasImages: !!images && images.length > 0,
      imageCount: images?.length || 0,
      extractedText: content.extractedText?.substring(0, 500),
      translatedText: content.translatedText?.substring(0, 500),
      summary: content.summary,
      keyPoints: content.keyPoints,
      highlights: content.highlights,
      tableOfContents: content.tableOfContents,
      keyTerms: content.keyTerms,
      // Return image metadata only (not dataUrls) in the summary GET
      images: images?.map((img) => ({
        page: img.page,
        index: img.index,
        width: img.width,
        height: img.height,
        caption: img.caption,
      })),
      errorMessage: content.errorMessage,
    },
  });
});
