import { prisma } from "@/lib/db";

export type GoalType = "BOOKS_PER_MONTH" | "MINUTES_PER_DAY";

export async function getGoals(userId: string) {
  return prisma.readingGoal.findMany({ where: { userId } });
}

export async function upsertGoal(userId: string, type: GoalType, target: number) {
  if (target < 1 || target > 100) throw new Error("Target 1-100 oralig'ida bo'lishi kerak");
  return prisma.readingGoal.upsert({
    where: { userId_type: { userId, type } },
    create: { userId, type, target },
    update: { target },
  });
}

export async function deleteGoal(userId: string, type: GoalType) {
  await prisma.readingGoal.deleteMany({ where: { userId, type } });
}

export async function getGoalProgress(userId: string, goal: { type: string; target: number }) {
  const now = new Date();
  if (goal.type === "BOOKS_PER_MONTH") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const count = await prisma.readingProgress.count({
      where: { userId, completedAt: { gte: start, lte: end } },
    });
    return { current: count, target: goal.target, percent: Math.min(100, Math.round((count / goal.target) * 100)) };
  } else {
    const start = new Date(now.setHours(0, 0, 0, 0));
    const end = new Date(now.setHours(23, 59, 59, 999));
    const agg = await prisma.readingSession.aggregate({
      where: { userId, startedAt: { gte: start, lte: end } },
      _sum: { duration: true },
    });
    const minutes = Math.round((agg._sum.duration ?? 0) / 60);
    return { current: minutes, target: goal.target, percent: Math.min(100, Math.round((minutes / goal.target) * 100)) };
  }
}
