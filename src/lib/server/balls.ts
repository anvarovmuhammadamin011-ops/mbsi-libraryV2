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
  | "MANUAL";

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

  const currentBalls = (user as any).balls ?? 0;
  const newBalance = clampBalls(currentBalls + amount);

  const [updatedUser, transaction] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { balls: newBalance } as any,
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

  const currentBalls = (user as any).balls ?? 0;
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
  return (user as any).balls ?? 0;
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
    const incompleteUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ["STUDENT", "TEACHER"] },
        userMissions: {
          none: { missionId: mission.id },
        },
      },
    });

    for (const user of incompleteUsers) {
      const alreadyPenalized = await prisma.ballTransaction.findFirst({
        where: {
          userId: user.id,
          type: "MISSION_PENALTY",
          referenceId: mission.id,
        },
      });

      if (!alreadyPenalized) {
        await penalizeMissionIncomplete(user.id, mission.id, mission.title);
        penalizedCount++;
      }
    }
  }

  return penalizedCount;
}
