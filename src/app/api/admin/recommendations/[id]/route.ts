import { route, json, readJson } from "@/lib/server/handler";
import { requireAdmin } from "@/lib/server/auth";
import { updateRecommendation, deleteRecommendation } from "@/lib/server/catalog";
import { recommendationSchema } from "@/lib/validation";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const PATCH = route(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const body = await readJson(req);
  const parsed = recommendationSchema.partial().safeParse(body);
  if (!parsed.success) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Noto'g'ri ma'lumot", 400);
  }
  const rec = await updateRecommendation(id, { ...parsed.data, userId: admin.id });
  return json({ success: true, data: rec });
});

export const DELETE = route(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  await deleteRecommendation(id, admin.id);
  return json({ success: true, data: { id } });
});
