import { prisma } from "@/lib/db";

export const MAX_BALLS = 12;
export const MIN_BALLS = 0;

// Kitob o'qish uchun juda kam ball beriladi - asosiy ball olish yo'li missiyalar
export const BOOK_READ_REWARDS = [0.02, 0.03, 0.05, 0.05, 0.08] as const;

// Missiya qiyinlik darajasiga qar ball miqdori
export const DIFFICULTY_BALL_REWARDS: Record<string, number> = {
  EASY: 0.3,    // Oson - kam ball
  MEDIUM: 0.6,  // O'rtacha - o'rtacha ball
  HARD: 1.0,    // Qiyin - ko'p ball
  EPIC: 1.5,    // Epik - juda ko'p ball
};
export const MISSION_PENALTY = -0.5; // Jazo ham kamroq
export const ADMIN_GIVE_AMOUNT = 1;
export const ADMIN_TAKE_AMOUNT = -1;

export type BallType =
  | "BOOK_READ"
  | "MISSION_COMPLETE"
  | "MISSION_PENALTY"
  | "ADMIN_GIVE"
  | "ADMIN_TAKE"
  | "MANUAL"
  | "INACTIVITY_PENALTY";

function clampBalls(value: number): number {
  return Math.max(MIN_BALLS, Math.min(MAX_BALLS, Math.round(value * 100) / 100));
}

export async function addBalls(
  userId: string,
  amount: number,
  type: BallType,
  description?: string,
  referenceId?: string
): Promise<{ newBalance: number; transactionId: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Foydalanuvchi topilmadi");

  const currentBalls = user.balls ?? 0;
  const newBalance = clampBalls(currentBalls + amount);

  const [updatedUser, transaction] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { balls: newBalance },
    }),
    prisma.ballTransaction.create({
      data: {
        userId,
        amount,
        balance: newBalance,
        type,
        description: description || null,
        referenceId: referenceId || null,
      },
    }),
  ]);

  return { newBalance, transactionId: transaction.id };
}

export async function takeBalls(
  userId: string,
  amount: number,
  type: BallType,
  description?: string,
  referenceId?: string
): Promise<{ newBalance: number; transactionId: string }> {
  return addBalls(userId, -Math.abs(amount), type, description, referenceId);
}

export async function setBalls(
  userId: string,
  newBalls: number,
  type: BallType,
  description?: string
): Promise<{ newBalance: number; transactionId: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Foydalanuvchi topilmadi");

  const currentBalls = user.balls ?? 0;
  const amount = clampBalls(newBalls) - currentBalls;

  if (Math.abs(amount) < 0.01) {
    return { newBalance: currentBalls, transactionId: "" };
  }

  return addBalls(userId, amount, type, description);
}

export async function awardBookRead(userId: string, bookId: string): Promise<number> {
  const randomIndex = Math.floor(Math.random() * BOOK_READ_REWARDS.length);
  const reward = BOOK_READ_REWARDS[randomIndex];

  const { newBalance } = await addBalls(
    userId,
    reward,
    "BOOK_READ",
    `Kitob o'qildi (+${reward} ball)`,
    bookId
  );

  return newBalance;
}

export async function awardMissionComplete(
  userId: string,
  missionId: string,
  missionTitle: string,
  difficulty?: string
): Promise<number> {
  const ballReward = DIFFICULTY_BALL_REWARDS[difficulty ?? "MEDIUM"] ?? DIFFICULTY_BALL_REWARDS.MEDIUM;
  const { newBalance } = await addBalls(
    userId,
    ballReward,
    "MISSION_COMPLETE",
    `Missiya bajarildi: ${missionTitle} (+${ballReward} ball)`,
    missionId
  );

  return newBalance;
}

export async function penalizeMissionIncomplete(
  userId: string,
  missionId: string,
  missionTitle: string
): Promise<number> {
  const { newBalance } = await takeBalls(
    userId,
    Math.abs(MISSION_PENALTY),
    "MISSION_PENALTY",
    `Missiya bajarilmadi: ${missionTitle} (${MISSION_PENALTY} ball)`,
    missionId
  );

  return newBalance;
}

export async function getBallHistory(userId: string, limit = 50) {
  return prisma.ballTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUserBalls(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return 0;
  return user.balls ?? 0;
}

export async function checkAndPenalizeExpiredMissions(): Promise<number> {
  const now = new Date();
  const expiredMissions = await prisma.mission.findMany({
    where: {
      isActive: true,
      endDate: { lt: now },
    },
  });

  let penalizedCount = 0;

  for (const mission of expiredMissions) {
    // Batched: barcha nomzod foydalanuvchi id'lari va allaqachon jazolanganni
    // bir martalik so'rovda yig'amiz — N+1 ni oldini oladi.
    const [incomplete, penalizedRows] = await Promise.all([
      prisma.user.findMany({
        where: {
          isActive: true,
          role: { in: ["STUDENT", "TEACHER"] },
          userMissions: {
            none: { missionId: mission.id },
          },
        },
        select: { id: true },
      }),
      prisma.ballTransaction.findMany({
        where: {
          type: "MISSION_PENALTY",
          referenceId: mission.id,
        },
        select: { userId: true },
      }),
    ]);

    const alreadyPenalized = new Set(penalizedRows.map((r) => r.userId));

    for (const user of incomplete) {
      if (!alreadyPenalized.has(user.id)) {
        await penalizeMissionIncomplete(user.id, mission.id, mission.title);
        penalizedCount++;
      }
    }
  }

  return penalizedCount;
}

// ─── Daily inactivity penalty ─────────────────────────────
// Penalize users who haven't read any book in the last 24 hours.
export const INACTIVITY_PENALTY = -0.1;

export async function penalizeInactiveUsers(): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Find active students/teachers having any ball to lose
  const activeUsers = await prisma.user.findMany({
    where: { isActive: true, role: { in: ["STUDENT", "TEACHER"] }, balls: { gt: 0 } },
    select: { id: true },
  });
  if (activeUsers.length === 0) return 0;

  const userIds = activeUsers.map((u) => u.id);

  // Batched: recent sessions and today's penalties in ONE query each — N+1 ni oldini oladi
  const [recentUsers, penalizedToday] = await Promise.all([
    prisma.readingSession.findMany({
      where: { userId: { in: userIds }, startedAt: { gte: oneDayAgo } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.ballTransaction.findMany({
      where: {
        userId: { in: userIds },
        type: "INACTIVITY_PENALTY",
        createdAt: { gte: todayStart },
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  const activeSet = new Set(recentUsers.map((r) => r.userId));
  const penalizedSet = new Set(penalizedToday.map((r) => r.userId));

  let penalizedCount = 0;

  for (const user of activeUsers) {
    if (activeSet.has(user.id) || penalizedSet.has(user.id)) continue;
    await takeBalls(
      user.id,
      Math.abs(INACTIVITY_PENALTY),
      "INACTIVITY_PENALTY",
      `O'qimaganlik uchun jazo (${INACTIVITY_PENALTY} ball)`
    );
    penalizedCount++;
  }

  return penalizedCount;
}
