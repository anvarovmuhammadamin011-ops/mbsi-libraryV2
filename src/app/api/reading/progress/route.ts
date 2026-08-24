import { route, json, readJson } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { upsertProgress, startBook } from "@/lib/server/reading";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

// Start or update reading progress for a book.
export const POST = route(async (req) => {
  const user = await requireUser();
  const body = await readJson<{ bookId: string; page: number }>(req);
  if (!body.bookId) {
    throw new ApiError(ERROR_CODES.VALIDATION, "bookId kerak", 400);
  }
  const progress = await upsertProgress(
    user.id,
    body.bookId,
    Number(body.page ?? 0)
  );
  return json({ success: true, data: progress });
});

// Ensure a book is started (enforces 3-book limit) without a page.
export const PUT = route(async (req) => {
  const user = await requireUser();
  const body = await readJson<{ bookId: string }>(req);
  if (!body.bookId) {
    throw new ApiError(ERROR_CODES.VALIDATION, "bookId kerak", 400);
  }
  const progress = await startBook(user.id, body.bookId);
  return json({ success: true, data: progress });
});
