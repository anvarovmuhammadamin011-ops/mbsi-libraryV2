import { route, json, readJson } from "@/lib/server/handler";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

const DIFFICULTY_BALL_REWARDS: Record<string, number> = {
  EASY: 0.3,
  MEDIUM: 0.6,
  HARD: 1.0,
  EPIC: 1.5,
};

export const PATCH = route(async (req, ctx) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const { id } = await ctx.params;
  const body = await readJson<{
    title?: string;
    description?: string;
    targetType?: string;
    target?: number;
    reward?: number;
    difficulty?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  }>(req);
  const data: any = {};
  if (body.title !== undefined) data.title = body.title.trim();
  if (body.description !== undefined) data.description = body.description?.trim() || null;
  if (body.targetType !== undefined) data.targetType = body.targetType;
  if (body.target !== undefined) data.target = Number(body.target);
  if (body.reward !== undefined) data.reward = Number(body.reward);
  if (body.difficulty !== undefined) {
    data.difficulty = body.difficulty;
    data.ballReward = DIFFICULTY_BALL_REWARDS[body.difficulty] ?? 0.6;
  }
  if (body.startDate !== undefined) data.startDate = new Date(body.startDate);
  if (body.endDate !== undefined) data.endDate = new Date(body.endDate);
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  const mission = await prisma.mission.update({ where: { id }, data });
  return json({ success: true, data: mission });
});

export const DELETE = route(async (_req, ctx) => {
  const admin = await requireRole("ADMIN");
  if (!admin) throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  const { id } = await ctx.params;
  await prisma.mission.delete({ where: { id } });
  return json({ success: true, data: null });
});
