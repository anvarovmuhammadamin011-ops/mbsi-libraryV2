import { route, json } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";
// eslint-disable-next-line @typescript-eslint/no-unused-vars

export const POST = route(async (req, ctx) => {
  await requireUser();
  const { id } = await ctx.params;

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);

  const body = await req.json();
  const { text } = body;

  if (!text || typeof text !== "string") {
    throw new ApiError(ERROR_CODES.VALIDATION, "Matn kerak", 400);
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
