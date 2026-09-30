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
  // O'qish+yo'zish cheklovi transaksiya ichida — bir vaqtdagi so'rovlar
  // (konkurent addBalls) balansni bir-birini ustidan yozmaydi.
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("Foydalanuvchi topilmadi");

    const currentBalls = user.balls ?? 0;
    const newBalance = clampBalls(currentBalls + amount);

    await tx.user.update({
      where: { id: userId },
      data: { balls: newBalance },
    });

    const transaction = await tx.ballTransaction.create({
      data: {
        userId,
        amount,
        balance: newBalance,
        type,
        description: description || null,
        referenceId: referenceId || null,
      },
    });

    return { newBalance, transactionId: transaction.id };
  });
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
