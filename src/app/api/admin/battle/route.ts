import { route } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { ApiError, ERROR_CODES, success } from "@/lib/server/errors";
import { getBattleData } from "@/lib/server/battle";

export const GET = route(async () => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const data = await getBattleData();
  return success(data);
});