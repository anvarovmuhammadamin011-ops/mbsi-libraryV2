import { route, json, readJson } from "@/lib/server/handler";
import { requireAdmin } from "@/lib/server/auth";
import { listBanners, createBanner } from "@/lib/server/catalog";
import { bannerSchema } from "@/lib/validation";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const GET = route(async () => {
  await requireAdmin();
  const items = await listBanners();
  return json({ success: true, data: items });
});

export const POST = route(async (req) => {
  const admin = await requireAdmin();
  const body = await readJson(req);
  const parsed = bannerSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Noto'g'ri ma'lumot", 400);
  }
  const banner = await createBanner({ ...parsed.data, userId: admin.id });
  return json({ success: true, data: banner }, 201);
});
