import { route, json, readJson } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";
import { reviewSchema } from "@/lib/validation";

export const DELETE = route(async (_req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new ApiError(ERROR_CODES.NOT_FOUND, "Sharh topilmadi", 404);
  if (review.userId !== user.id && user.role !== "ADMIN") throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  await prisma.review.delete({ where: { id } });
  return json({ success: true, data: null });
});

export const PATCH = route(async (req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new ApiError(ERROR_CODES.NOT_FOUND, "Sharh topilmadi", 404);
  if (review.userId !== user.id) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const body = await readJson<{ rating: number; text: string }>(req);
  const parsed = reviewSchema.safeParse({ bookId: review.bookId, rating: body.rating, text: body.text });
  if (!parsed.success) throw new ApiError(ERROR_CODES.VALIDATION, "Noto'g'ri ma'lumot", 400);
  const updated = await prisma.review.update({
    where: { id },
    data: { rating: parsed.data.rating, text: parsed.data.text },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
  await prisma.rating.upsert({
    where: { userId_bookId: { userId: user.id, bookId: review.bookId } },
    create: { userId: user.id, bookId: review.bookId, rating: parsed.data.rating },
    update: { rating: parsed.data.rating },
  });
  return json({ success: true, data: updated });
});
