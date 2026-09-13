import { route, json } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { getUserActivityRange } from "@/lib/server/users";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

// GET /api/admin/users/[id]/activity?from=YYYY-MM-DD&to=YYYY-MM-DD
export const GET = route(async (req, ctx) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);

  const { id } = await ctx.params;
  const now = new Date();
  const fromRaw = req.nextUrl.searchParams.get("from");
  const toRaw = req.nextUrl.searchParams.get("to");

  const from = fromRaw ? new Date(`${fromRaw}T00:00:00`) : new Date(now.getTime() - 30 * 86400000);
  const to = toRaw ? new Date(`${toRaw}T23:59:59.999`) : now;
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Noto'g'ri sana", 400);
  }

  const data = await getUserActivityRange(id, from, to);
  return json({ success: true, data });
});