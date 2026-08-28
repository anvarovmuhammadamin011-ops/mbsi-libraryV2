import { prisma } from "@/lib/db";
import { computeStreak } from "./reading";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: string;
};

export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  const [completedCount, sessions] = await Promise.all([
    prisma.readingProgress.count({ where: { userId, completedAt: { not: null } } }),
    prisma.readingSession.findMany({ where: { userId }, select: { startedAt: true } }),
  ]);

  const streak = computeStreak(sessions.map((s) => s.startedAt));

  return [
    {
      id: "first-book",
      title: "First Book",
      description: "Birinchi kitobni tugatdi",
      icon: "🏆",
      unlocked: completedCount >= 1,
      progress: `${Math.min(completedCount, 1)}/1`,
    },
    {
      id: "streak-7",
      title: "7 Day Reader",
      description: "7 kun ketma-ket o'qidi",
      icon: "🔥",
      unlocked: streak >= 7,
      progress: `${Math.min(streak, 7)}/7 kun`,
    },
    {
      id: "five-books",
      title: "5 Books",
      description: "5 ta kitob tugatdi",
      icon: "📚",
      unlocked: completedCount >= 5,
      progress: `${Math.min(completedCount, 5)}/5`,
    },
    {
      id: "knowledge-seeker",
      title: "Knowledge Seeker",
      description: "10 ta kitob tugatdi",
      icon: "🎓",
      unlocked: completedCount >= 10,
      progress: `${Math.min(completedCount, 10)}/10`,
    },
  ];
}
