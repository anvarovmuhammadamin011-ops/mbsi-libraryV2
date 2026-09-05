import { route, json } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";
import { aiExtractPages, hasAIKey } from "@/lib/server/ai-client";

/**
 * POST /api/books/[id]/content/ai-extract
 *
 * Accepts base64 page images from the client and extracts text using AI vision.
 *
 * Body:
 *   { pages: { page: number; imageData: string }[] }
 *   imageData is a base64 data URI (data:image/png;base64,...)
 *
 * Processes pages in batches of BATCH_SIZE to avoid token limits.
 * Saves the full extracted text to BookContent.
 */

// One page per AI call: keeps input/output tokens under free-tier
// provider rate limits (429). The client sends one page per request too.
const BATCH_SIZE = 1;

export const POST = route(async (req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;

  if (!hasAIKey()) {
    throw new ApiError(
      ERROR_CODES.VALIDATION,
      "AI API kaliti sozlanmagan. AI_PROVIDER va AI_API_KEY .env faylida bo'lishi kerak.",
      400
    );
  }

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);

  const body = await req.json();
  const { pages } = body;

  if (!Array.isArray(pages) || pages.length === 0) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Sahifa rasmlari kerak", 400);
  }

  // Process pages in batches
  const allResults: { page: number; text: string }[] = [];
  let lastError: string | null = null;

  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    const batch = pages.slice(i, i + BATCH_SIZE);

    try {
      const extracted = await aiExtractPages(batch);

      for (let j = 0; j < batch.length; j++) {
        allResults.push({
          page: batch[j].page,
          text: extracted[j] || "",
        });
      }
    } catch (err: any) {
      lastError = err?.message || "Noma'lum xato";
      console.error(
        `[ai-extract] Batch ${i / BATCH_SIZE + 1} failed:`,
        lastError
      );
      // Still add empty results for failed pages
      for (const p of batch) {
        allResults.push({ page: p.page, text: "" });
      }
    }
  }

  // Sort by page number and combine
  allResults.sort((a, b) => a.page - b.page);
  const fullText = allResults.map((r) => r.text).join("\n\n");

  if (!fullText.trim()) {
    const isRateLimit =
      lastError && /429|rate limit|tokens per minute/i.test(lastError);
    throw new ApiError(
      ERROR_CODES.VALIDATION,
      isRateLimit
        ? "AI so'rov chegarasi to'ldi (rate limit). Bir necha daqiqa kuting va qayta urinib ko'ring."
        : `AI matn ajrata olmadi${
            lastError ? `: ${lastError}` : ". Sahifa rasmlari sifatini tekshiring."
          }`,
      400
    );
  }

  // Append to previously extracted text when the client sends pages in
  // multiple requests, so earlier batches are not overwritten.
  const append = body.append === true;
  const existing = append
    ? await prisma.bookContent
        .findUnique({ where: { bookId: id }, select: { extractedText: true } })
        .then((c) => c?.extractedText || "")
    : "";

  const combinedText = existing ? `${existing}\n\n${fullText}` : fullText;

  await prisma.bookContent.upsert({
    where: { bookId: id },
    create: {
      bookId: id,
      extractedText: combinedText,
      status: "completed",
    },
    update: {
      extractedText: combinedText,
      status: "completed",
    },
  });

  return json({
    success: true,
    data: {
      textLength: combinedText.length,
      pagesExtracted: allResults.filter((r) => r.text.trim()).length,
      totalPages: pages.length,
      failedPages: allResults.filter((r) => !r.text.trim()).length,
      message: "Matn AI orqali ajratildi",
    },
  });
});
