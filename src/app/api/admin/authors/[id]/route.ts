import { route, json, readJson } from "@/lib/server/handler";
import { requireAdmin } from "@/lib/server/auth";
import { updateAuthor, deleteAuthor } from "@/lib/server/catalog";
import { authorSchema } from "@/lib/validation";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const PATCH = route(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const body = await readJson(req);
  const parsed = authorSchema.partial().safeParse(body);
  if (!parsed.success) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Noto'g'ri ma'lumot", 400);
  }
  const author = await updateAuthor(id, { ...parsed.data, userId: admin.id });
  return json({ success: true, data: author });
});

export const DELETE = route(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  await deleteAuthor(id, admin.id);
  return json({ success: true, data: { id } });
});
