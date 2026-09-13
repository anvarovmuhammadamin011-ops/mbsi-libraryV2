import { route } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";
import { resetUserPassword } from "@/lib/server/users";

export const POST = route(async (_req, ctx) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const { id } = await ctx.params;
  const plainPassword = await resetUserPassword(id, admin.id);
  return success({ id, resetAt: new Date().toISOString(), password: plainPassword });
});