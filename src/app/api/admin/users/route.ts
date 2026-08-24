import { route, json, readJson } from "@/lib/server/handler";
import { requireAdmin } from "@/lib/server/auth";
import { listUsers, updateUser } from "@/lib/server/catalog";
import { userUpdateSchema } from "@/lib/validation";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const GET = route(async (req) => {
  await requireAdmin();
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  const role = req.nextUrl.searchParams.get("role") ?? undefined;
  const items = await listUsers({ q, role: role ?? undefined });
  return json({ success: true, data: items });
});

export const PATCH = route(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const body = await readJson(req);
  const parsed = userUpdateSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Noto'g'ri ma'lumot", 400);
  }
  const user = await updateUser(id, { ...parsed.data, userId: admin.id });
  return json({ success: true, data: user });
});
