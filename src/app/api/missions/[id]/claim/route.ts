import { route, json } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { claimMission } from "@/lib/server/missions";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const POST = route(async (_req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  try {
    const result = await claimMission(user.id, id);
    return json({ success: true, data: result });
  } catch (e: any) {
    throw new ApiError(ERROR_CODES.VALIDATION, e.message || "Xatolik", 400);
  }
});
