import { route, json, readJson } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { toggleHideReview, deleteReviewById } from "@/lib/server/reviews";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";
import { prisma } from "@/lib/db";

export const PATCH = route(async (req, ctx) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const { id } = await ctx.params;
  const body = await readJson<{ isHidden: boolean }>(req);
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw new ApiError(ERROR_CODES.NOT_FOUND, "Sharh topilmadi", 404);
  const updated = await toggleHideReview(id, Boolean(body.isHidden));
  return json({ success: true, data: updated });
});

export const DELETE = route(async (_req, ctx) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const { id } = await ctx.params;
  await deleteReviewById(id);
  return json({ success: true, data: null });
});
