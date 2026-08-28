import { route, json } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { listAllReviewsForAdmin } from "@/lib/server/reviews";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const GET = route(async () => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const reviews = await listAllReviewsForAdmin();
  return json({ success: true, data: reviews });
});
