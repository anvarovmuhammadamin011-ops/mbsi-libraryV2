import { route, json } from "@/lib/server/handler";
import { requireBookManager } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

// OCR'dan chiqqan to'liq matn serverda saqlanadi. Faqat ADMIN/KITOB MENEJERI
// yozishi mumkin va hajm cheklangan (tasodifiy/zararli yukni oldini olish).
const MAX_TEXT_BYTES = 10 * 1024 * 1024; // 10 MB

export const POST = route(async (req, ctx) => {
  const manager = await requireBookManager();
  if (!manager) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  }
  const { id } = await ctx.params;

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);

  const body = await req.json();
  const { text } = body;

  if (!text || typeof text !== "string") {
    throw new ApiError(ERROR_CODES.VALIDATION, "Matn kerak", 400);
  }
  if (!text.trim()) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Bo'sh matn saqlanmadi", 400);
  }
  if (Buffer.byteLength(text, "utf8") > MAX_TEXT_BYTES) {
    throw new ApiError(
      ERROR_CODES.VALIDATION,
      "Matn hajmi 10 MB dan oshmasligi kerak",
      400
    );
  }

  // Save extracted text to BookContent
  await prisma.bookContent.upsert({
    where: { bookId: id },
    create: {
      bookId: id,
      extractedText: text,
      status: "completed",
    },
    update: {
      extractedText: text,
      status: "completed",
    },
  });

  return json({
    success: true,
    data: {
      textLength: text.length,
      message: "Matn saqlandi",
    },
  });
});
