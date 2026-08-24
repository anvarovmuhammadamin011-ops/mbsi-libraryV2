import { route, json } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { deleteBookmark } from "@/lib/server/reading";

export const DELETE = route(async (req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  await deleteBookmark(id, user.id);
  return json({ success: true, data: { id } });
});
