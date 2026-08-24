import { route, json } from "@/lib/server/handler";
import { requireUser, requireAdmin } from "@/lib/server/auth";
import { getPersonalStats } from "@/lib/server/reading";
import { getDashboard } from "@/lib/server/dashboard";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const GET = route(async (req) => {
  const user = await requireUser();
  const isPlatform = req.nextUrl.searchParams.get("scope") === "platform";
  if (isPlatform) {
    await requireAdmin();
    const filter = (req.nextUrl.searchParams.get("filter") || "7d") as
      | "today"
      | "7d"
      | "30d"
      | "all";
    const data = await getDashboard(filter);
    return json({ success: true, data });
  }
  const stats = await getPersonalStats(user.id, user.role);
  return json({ success: true, data: stats });
});
