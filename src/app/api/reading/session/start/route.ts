import { route, json, readJson } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { startSession } from "@/lib/server/reading";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const POST = route(async (req) => {
  const user = await requireUser();
  const body = await readJson<{ bookId: string; startPage: number }>(req);
  if (!body.bookId) {
    throw new ApiError(ERROR_CODES.VALIDATION, "bookId kerak", 400);
  }
  const { sessionId, progress } = await startSession(
    user.id,
    body.bookId,
    Number(body.startPage ?? 1)
  );
  return json({ success: true, data: { sessionId, progress } });
});
