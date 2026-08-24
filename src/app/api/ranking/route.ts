import { route, json } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { getRanking, getUserRank } from "@/lib/server/reading";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const GET = route(async (req) => {
  const user = await requireUser();
  const roleParam = req.nextUrl.searchParams.get("role");
  const role: "STUDENT" | "TEACHER" =
    roleParam === "TEACHER" ? "TEACHER" : "STUDENT";
  const entries = await getRanking(role);
  let currentUserRank: number | null = null;
  if (user.role === role) {
    currentUserRank = await getUserRank(user.id, role);
  }
  return json({ success: true, data: { entries, currentUserRank, role } });
});
