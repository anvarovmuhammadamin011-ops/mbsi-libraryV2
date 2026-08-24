import { route, json, readJson } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import {
  listFavorites,
  addFavorite,
  removeFavorite,
  isFavorite,
} from "@/lib/server/reading";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const GET = route(async (req) => {
  const user = await requireUser();
  const bookId = req.nextUrl.searchParams.get("bookId");
  if (bookId) {
    return json({ success: true, data: { isFavorite: await isFavorite(user.id, bookId) } });
  }
  const items = await listFavorites(user.id);
  return json({ success: true, data: items });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const body = await readJson<{ bookId: string }>(req);
  if (!body.bookId) {
    throw new ApiError(ERROR_CODES.VALIDATION, "bookId kerak", 400);
  }
  await addFavorite(user.id, body.bookId);
  return json({ success: true, data: { bookId: body.bookId, isFavorite: true } }, 201);
});

export const DELETE = route(async (req, ctx) => {
  const user = await requireUser();
  const { bookId } = await ctx.params;
  await removeFavorite(user.id, bookId);
  return json({ success: true, data: { bookId, isFavorite: false } });
});
