import { prisma } from "@/lib/db";

export type MissionWithProgress = {
  id: string;
  title: string;
  description: string | null;
  targetType: string;
  target: number;
  reward: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  progress: number;
  claimed: boolean;
  status: "active" | "completed" | "claimable" | "expired";
};

export async function getMissionsForUser(userId: string): Promise<MissionWithProgress[]> {
  const missions = await prisma.mission.findMany({
    where: { isActive: true },
    orderBy: { startDate: "desc" },
  });
  const claimed = await prisma.userMission.findMany({ where: { userId } });
  const claimedSet = new Set(claimed.map((c) => c.missionId));

  const result: MissionWithProgress[] = [];
  for (const m of missions) {
    let progress = 0;
    if (m.targetType === "PAGES") {
      const agg = await prisma.readingSession.aggregate({
        where: { userId, startedAt: { gte: m.startDate, lte: m.endDate } },
        _sum: { pagesRead: true },
      });
      progress = agg._sum.pagesRead ?? 0;
    } else {
      // BOOKS
      progress = await prisma.readingProgress.count({
        where: { userId, completedAt: { gte: m.startDate, lte: m.endDate } },
      });
    }
    const isExpired = new Date() > m.endDate && progress < m.target;
    const isCompleted = progress >= m.target;
    const claimedFlag = claimedSet.has(m.id);
    let status: MissionWithProgress["status"] = "active";
    if (claimedFlag) status = "completed";
    else if (isExpired) status = "expired";
    else if (isCompleted) status = "claimable";

    result.push({
      id: m.id,
      title: m.title,
      description: m.description,
      targetType: m.targetType,
      target: m.target,
      reward: m.reward,
      startDate: m.startDate,
      endDate: m.endDate,
      isActive: m.isActive,
      progress: Math.min(progress, m.target),
      claimed: claimedFlag,
      status,
    });
  }
  return result;
}

export async function claimMission(userId: string, missionId: string) {
  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission || !mission.isActive) throw new Error("Missiya topilmadi");
  const existing = await prisma.userMission.findUnique({
    where: { userId_missionId: { userId, missionId } },
  });
  if (existing) throw new Error("Allaqachon olingan");

  let progress = 0;
  if (mission.targetType === "PAGES") {
    const agg = await prisma.readingSession.aggregate({
      where: { userId, startedAt: { gte: mission.startDate, lte: mission.endDate } },
      _sum: { pagesRead: true },
    });
    progress = agg._sum.pagesRead ?? 0;
  } else {
    progress = await prisma.readingProgress.count({
      where: { userId, completedAt: { gte: mission.startDate, lte: mission.endDate } },
    });
  }
  if (progress < mission.target) throw new Error("Missiya hali bajarilmagan");

  await prisma.$transaction([
    prisma.userMission.create({ data: { userId, missionId } }),
    prisma.user.update({ where: { id: userId }, data: { coins: { increment: mission.reward } } }),
  ]);

  return { reward: mission.reward };
}
