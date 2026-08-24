import { route, json, readJson } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { endSession } from "@/lib/server/reading";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const POST = route(async (req) => {
  const user = await requireUser();
  const body = await readJson<{ sessionId: string; endPage: number }>(req);
  if (!body.sessionId) {
    throw new ApiError(ERROR_CODES.VALIDATION, "sessionId kerak", 400);
  }
  const result = await endSession(
    body.sessionId,
    user.id,
    Number(body.endPage ?? 0)
  );
  return json({ success: true, data: result });
});
