import { route, json, readJson } from "@/lib/server/handler";
import { requireUser } from "@/lib/server/auth";
import { getGoals, upsertGoal, deleteGoal, getGoalProgress } from "@/lib/server/goals";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const GET = route(async () => {
  const user = await requireUser();
  const goals = await getGoals(user.id);
  const withProgress = await Promise.all(
    goals.map(async (g) => {
      const p = await getGoalProgress(user.id, g);
      return { ...g, progress: p };
    })
  );
  return json({ success: true, data: withProgress });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  const body = await readJson<{ type: string; target: number }>(req);
  if (!body.type || !["BOOKS_PER_MONTH", "MINUTES_PER_DAY"].includes(body.type)) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Noto'g'ri maqsad turi", 400);
  }
  if (!body.target || body.target < 1 || body.target > 100) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Target 1-100 oralig'ida", 400);
  }
  const goal = await upsertGoal(user.id, body.type as any, body.target);
  return json({ success: true, data: goal }, 201);
});

export const DELETE = route(async (req) => {
  const user = await requireUser();
  const type = req.nextUrl.searchParams.get("type");
  if (!type || !["BOOKS_PER_MONTH", "MINUTES_PER_DAY"].includes(type)) {
    throw new ApiError(ERROR_CODES.VALIDATION, "type kerak", 400);
  }
  await deleteGoal(user.id, type as any);
  return json({ success: true, data: null });
});
