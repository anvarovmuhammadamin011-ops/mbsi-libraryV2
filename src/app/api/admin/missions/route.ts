import { route, json, readJson } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

export const GET = route(async () => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const missions = await prisma.mission.findMany({ orderBy: { createdAt: "desc" } });
  return json({ success: true, data: missions });
});

const DIFFICULTY_BALL_REWARDS: Record<string, number> = {
  EASY: 0.3,
  MEDIUM: 0.6,
  HARD: 1.0,
  EPIC: 1.5,
};

export const POST = route(async (req) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const body = await readJson<{
    title: string;
    description?: string;
    targetType: string;
    target: number;
    reward: number;
    difficulty?: string;
    startDate: string;
    endDate: string;
  }>(req);

  if (!body.title?.trim() || !body.targetType || !body.target || !body.reward || !body.startDate || !body.endDate) {
    throw new ApiError(ERROR_CODES.VALIDATION, "Barcha maydonlar to'ldirilishi kerak", 400);
  }
  if (!["PAGES", "BOOKS"].includes(body.targetType)) throw new ApiError(ERROR_CODES.VALIDATION, "targetType PAGES yoki BOOKS bo'lishi kerak", 400);

  const difficulty = body.difficulty && ["EASY", "MEDIUM", "HARD", "EPIC"].includes(body.difficulty) ? body.difficulty : "MEDIUM";
  const ballReward = DIFFICULTY_BALL_REWARDS[difficulty] ?? 0.6;

  const mission = await prisma.mission.create({
    data: {
      title: body.title.trim(),
      description: body.description?.trim() || null,
      targetType: body.targetType,
      target: Number(body.target),
      reward: Number(body.reward),
      difficulty,
      ballReward,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    },
  });
  return json({ success: true, data: mission }, 201);
});
