import { route } from "@/lib/server/handler";
import { requireBookManager } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";

export const DELETE = route(async (req, ctx) => {
  const user = await requireBookManager();
  const { id } = await ctx.params;
  await prisma.category.delete({ where: { id } }).catch(() => {});
  return success({ ok: true });
});
