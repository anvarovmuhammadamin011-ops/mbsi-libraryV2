import { route, json } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { getSmartInsights } from "@/lib/server/insights";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const GET = route(async () => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const insights = await getSmartInsights();
  return json({ success: true, data: insights });
});
