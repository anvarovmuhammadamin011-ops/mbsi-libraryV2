import { route, json, readJson } from "@/lib/server/handler";
import { requireAdmin } from "@/lib/server/auth";
import { listRecommendations, createRecommendation } from "@/lib/server/catalog";
import { recommendationSchema } from "@/lib/validation";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const GET = route(async () => {
  await requireAdmin();
  const items = await listRecommendations();
  return json({ success: true, data: items });
});

export const POST = route(async (req) => {
  const admin = await requireAdmin();
  const body = await readJson(req);
  const parsed = recommendationSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Noto'g'ri ma'lumot", 400);
  }
  const rec = await createRecommendation({ ...parsed.data, userId: admin.id });
  return json({ success: true, data: rec }, 201);
});
