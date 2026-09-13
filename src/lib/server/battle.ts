import { prisma } from "@/lib/db";
import { getSystemSettings } from "./system-settings";
import type {
  BattleTeamStats,
  BattleLeaderboardEntry,
  QuizTeamAgg,
} from "@/types";

/**
 * CS2 uslubidagi kitob o'qish "battle" — O'quvchilar vs O'qituvchilar.
 * Faqat haqiqiy o'qish faoliyati hisoblanadi:
 *  - session pagesRead/duration minimal chegaradan o'tgan bo'lsa "valid" deb hisoblanadi
 *    (kitobni ochib qo'yish bilan ockolash mumkin emas)
 *  - kitob boshlash (start), >=50% o'qish (progress), tugatish (complete) uchun ochko
 */
export async function getBattleData(): Promise<QuizTeamAgg> {
  const settings = await getSystemSettings();
  const roles = ["STUDENT", "TEACHER"];

  const [users, sessions, progressRows] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: roles }, isActive: true },
      select: {
        id: true,
        name: true,
        role: true,
        group: true,
        staffPosition: true,
        avatar: true,
      },
    }),
    prisma.readingSession.findMany({
      where: { user: { role: { in: roles } } },
      select: {
        userId: true,
        bookId: true,
        pagesRead: true,
        duration: true,
      },
    }),
    prisma.readingProgress.findMany({
      where: { user: { role: { in: roles } } },
      select: { userId: true, bookId: true, progress: true, completedAt: true },
    }),
  ]);

  const minPages = Math.max(1, settings.minPagesPerRead);
  const minSeconds = Math.max(1, settings.minSecondsPerRead);

  const validSessions = sessions.filter(
    (s) => s.pagesRead >= minPages && s.duration >= minSeconds
  );

  const validKeys = new Set(
    validSessions.map((s) => `${s.userId}|${s.bookId}`)
  );
  const progressKeys = new Set<string>();
  const completedKeys = new Set<string>();
  for (const r of progressRows) {
    if (r.progress >= 50) progressKeys.add(`${r.userId}|${r.bookId}`);
    if (r.completedAt) completedKeys.add(`${r.userId}|${r.bookId}`);
  }

  // Teama bo'yicha yig'indilar
  const teamInfo: Record<"STUDENT" | "TEACHER", { users: typeof users; ids: Set<string> }> = {
    STUDENT: { users: [], ids: new Set() },
    TEACHER: { users: [], ids: new Set() },
  };
  for (const u of users) {
    const key = u.role === "STUDENT" ? "STUDENT" : "TEACHER";
    teamInfo[key].users.push(u);
    teamInfo[key].ids.add(u.id);
  }

  const perTeam = (team: "STUDENT" | "TEACHER") => {
    const ids = teamInfo[team].ids;
    const started = new Set<string>();
    const progressed = new Set<string>();
    const completed = new Set<string>();
    let pagesRead = 0;
    let readingSeconds = 0;
    let sessionsCount = 0;
    const activeUserIds = new Set<string>();

    for (const s of validSessions) {
      if (!ids.has(s.userId)) continue;
      const k = `${s.userId}|${s.bookId}`;
      started.add(k);
      pagesRead += s.pagesRead;
      readingSeconds += s.duration;
      sessionsCount++;
      activeUserIds.add(s.userId);
    }
    for (const k of progressKeys) {
      const userId = k.split("|")[0];
      if (ids.has(userId)) progressed.add(k);
    }
    for (const k of completedKeys) {
      const userId = k.split("|")[0];
      if (ids.has(userId)) completed.add(k);
    }

    // Per-user ochko
    const points = new Map<string, number>();
    for (const u of teamInfo[team].users) {
      let p = 0;
      for (const bookId of distinctBookIds(Array.from(started), u.id)) {
        p += settings.battleStartPoints;
      }
      for (const bookId of distinctBookIds(Array.from(progressed), u.id)) {
        p += settings.battleProgressPoints;
      }
      for (const bookId of distinctBookIds(Array.from(completed), u.id)) {
        p += settings.battleCompletePoints;
      }
      points.set(u.id, p);
    }

    const score = Array.from(points.values()).reduce((a, b) => a + b, 0);

    return {
      team,
      score,
      points: new Map(points),
      teamUsers: teamInfo[team].users,
      started: started.size,
      progressed: progressed.size,
      completed: completed.size,
      activeUsers: activeUserIds.size,
      pagesRead,
      readingSeconds,
      sessions: sessionsCount,
    };
  };

  const sAgg = perTeam("STUDENT");
  const tAgg = perTeam("TEACHER");

  // Umumiy leaderboard (ikkala jamoa, ochko bo'yicha)
  const leaderboard: BattleLeaderboardEntry[] = [
    ...sAgg.teamUsers.map((u) => buildEntry(u, "STUDENT", sAgg.points)),
    ...tAgg.teamUsers.map((u) => buildEntry(u, "TEACHER", tAgg.points)),
  ]
    .filter((e) => e.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 30)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const winner =
    sAgg.score === tAgg.score
      ? "TIE"
      : sAgg.score > tAgg.score
        ? "STUDENT"
        : "TEACHER";

  const mkTeam = (agg: ReturnType<typeof perTeam>): BattleTeamStats => {
    let top: UserBrief | null = null;
    let topPts = -1;
    for (const u of agg.teamUsers) {
      const p = agg.points.get(u.id) ?? 0;
      if (p > topPts) {
        topPts = p;
        top = {
          id: u.id,
          name: u.name,
          role: u.role,
          group: u.group,
          staffPosition: u.staffPosition,
          avatar: u.avatar,
        };
      }
    }
    return {
      team: agg.team,
      score: agg.score,
      booksStarted: agg.started,
      booksCompleted: agg.completed,
      activeUsers: agg.activeUsers,
      pagesRead: agg.pagesRead,
      readingSeconds: agg.readingSeconds,
      sessions: agg.sessions,
      topUser: topPts > 0 ? top : null,
    };
  };

  return {
    student: mkTeam(sAgg),
    teacher: mkTeam(tAgg),
    winner,
    leaderboard,
  };
}

type UserBrief = {
  id: string;
  name: string;
  role: string;
  group?: string | null;
  staffPosition?: string | null;
  avatar?: string | null;
};

function buildEntry(
  u: { id: string; name: string; role: string; group: string | null; staffPosition: string | null; avatar: string | null },
  team: "STUDENT" | "TEACHER",
  points: Map<string, number>
): BattleLeaderboardEntry {
  return {
    rank: 0,
    userId: u.id,
    name: u.name,
    role: team === "STUDENT" ? "STUDENT" : "TEACHER",
    group: u.group ?? null,
    position: u.staffPosition ?? null,
    avatar: u.avatar ?? null,
    booksStarted: 0,
    booksCompleted: 0,
    pagesRead: 0,
    readingSeconds: 0,
    validSessions: 0,
    points: points.get(u.id) ?? 0,
  };
}

function distinctBookIds(keys: string[], userId: string): string[] {
  const out = new Set<string>();
  for (const k of keys) {
    const [u, b] = k.split("|");
    if (u === userId) out.add(b);
  }
  return Array.from(out);
}

/** Sessiya davomiyligi "12 daq" formatida. */
export function formatReadable(seconds: number): string {
  if (!seconds || seconds <= 0) return "0 daq";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h} soat ${m > 0 ? `${m} daq` : ""}`.trim();
  return `${m} daq`;
}