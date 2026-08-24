import { route, json, readJson } from "@/lib/server/handler";
import { requireAdmin } from "@/lib/server/auth";
import { updateBanner, deleteBanner } from "@/lib/server/catalog";
import { bannerSchema } from "@/lib/validation";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const PATCH = route(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const body = await readJson(req);
  const parsed = bannerSchema.partial().safeParse(body);
  if (!parsed.success) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Noto'g'ri ma'lumot", 400);
  }
  const banner = await updateBanner(id, { ...parsed.data, userId: admin.id });
  return json({ success: true, data: banner });
});

export const DELETE = route(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  await deleteBanner(id, admin.id);
  return json({ success: true, data: { id } });
});
