import { route, json, readJson } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { answerAdminQuery } from "@/lib/server/insights";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const POST = route(async (req) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const body = await readJson<{ question: string }>(req);
  const q = body.question?.trim();
  if (!q || q.length < 3) throw new ApiError(ERROR_CODES.VALIDATION, "Savol juda qisqa", 400);
  const answer = await answerAdminQuery(q);
  return json({ success: true, data: { question: q, answer } });
});
