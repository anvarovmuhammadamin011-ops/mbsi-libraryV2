import { route, json, readJson } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { reviewSchema } from "@/lib/validation";
import { listReviews, upsertReview } from "@/lib/server/reviews";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const GET = route(async (req) => {
  const bookId = req.nextUrl.searchParams.get("bookId");
  if (!bookId) throw new ApiError(ERROR_CODES.VALIDATION, "bookId kerak", 400);
  const reviews = await listReviews(bookId);
  return json({ success: true, data: reviews });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const body = await readJson<{ bookId: string; rating: number; text: string }>(req);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(ERROR_CODES.VALIDATION, "Noto'g'ri ma'lumot", 400);
  const review = await upsertReview(user.id, parsed.data.bookId, parsed.data.rating, parsed.data.text);
  return json({ success: true, data: review }, 201);
});
