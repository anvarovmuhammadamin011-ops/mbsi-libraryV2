import { route, json } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { listBookmarks, createBookmark, deleteBookmark } from "@/lib/server/reading";
import { bookmarkSchema } from "@/lib/validation";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const GET = route(async (req) => {
  const user = await requireUser();
  const bookId = req.nextUrl.searchParams.get("bookId") ?? undefined;
  const items = await listBookmarks(user.id, bookId);
  return json({ success: true, data: items });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const parsed = bookmarkSchema.safeParse(body);
  if (!parsed.success || !body.bookId) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Noto'g'ri ma'lumot", 400);
  }
  const bm = await createBookmark(
    user.id,
    String(body.bookId),
    parsed.data.page,
    parsed.data.note
  );
  return json({ success: true, data: bm }, 201);
});

export const DELETE = route(async () => {
  // Bookmark deletion is handled at /api/bookmarks/[id]
  return json(
    { success: false, error: { code: "METHOD_NOT_ALLOWED", message: "DELETE /api/bookmarks/[id] dan foydalaning" } },
    405
  );
});
