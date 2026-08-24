import { route, json, readJson } from "@/lib/server/handler";
import { requireAdmin } from "@/lib/server/auth";
import { setPublish } from "@/lib/server/books";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const POST = route(async (req, ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const body = await readJson<{ isPublished?: boolean }>(req);
  const isPublished = Boolean(body.isPublished);
  const book = await setPublish(id, isPublished, admin.id);
  return json({ success: true, data: book });
});
