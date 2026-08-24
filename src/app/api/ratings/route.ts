import { route, json, readJson } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { upsertRating, getUserRating } from "@/lib/server/reading";
import { ratingSchema } from "@/lib/validation";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const GET = route(async (req) => {
  const user = await requireUser();
  const bookId = req.nextUrl.searchParams.get("bookId");
  if (!bookId) {
    throw new ApiError(ERROR_CODES.VALIDATION, "bookId kerak", 400);
  }
  const rating = await getUserRating(user.id, bookId);
  return json({ success: true, data: { rating } });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const body = await readJson<{ bookId: string; rating: number }>(req);
  const parsed = ratingSchema.safeParse({ rating: body.rating });
  if (!parsed.success || !body.bookId) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Noto'g'ri baho", 400);
  }
  const result = await upsertRating(user.id, body.bookId, parsed.data.rating);
  return json({ success: true, data: { ...result, bookId: body.bookId } });
});
