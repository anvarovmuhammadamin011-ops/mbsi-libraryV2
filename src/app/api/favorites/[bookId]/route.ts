import { route, json } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { removeFavorite, isFavorite } from "@/lib/server/reading";

export const DELETE = route(async (_req, ctx) => {
  const user = await requireUser();
  const { bookId } = await ctx.params;
  await removeFavorite(user.id, bookId);
  return json({ success: true, data: { bookId, isFavorite: false } });
});

export const GET = route(async (_req, ctx) => {
  const user = await requireUser();
  const { bookId } = await ctx.params;
  const fav = await isFavorite(user.id, bookId);
  return json({ success: true, data: { isFavorite: fav } });
});
