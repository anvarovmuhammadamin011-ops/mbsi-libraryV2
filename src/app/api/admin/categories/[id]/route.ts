import { route } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";

export const DELETE = route(async (req, ctx) => {
  const user = await requireRole("ADMIN");
  if (!user) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const { id } = await ctx.params;
  await prisma.category.delete({ where: { id } }).catch(() => {});
  return success({ ok: true });
});
