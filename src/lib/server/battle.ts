import { prisma } from "@/lib/db";
import { getSystemSettings } from "./system-settings";
import type {
  BattleTeamStats,
  BattleLeaderboardEntry,
  QuizTeamAgg,
} from "@/types";

/**
 * CS2 uslubidagi kitob o'qish "battle" — O'quvchilar vs Xodimlar.
 *
 * Jamoalar:
 *  - STUDENT  — faqat o'quvchilar
 *  - STAFF    — o'qituvchilar, boshqa xodimlar, kitob menejeri, registrator
 *               (admin hisobga olinmaydi — u kuzatuvchi)
 *
 * Faqat haqiqiy o'qish faoliyati hisoblanadi:
 *  - session pagesRead/duration minimal chegaradan o'tgan bo'lsa "valid"
 *    (kitobni ochib qo'yish bilan ochko olish mumkin emas)
 *  - kitob boshlash va tugatish uchun ochko
 */
export async function getBattleData(): Promise<QuizTeamAgg> {
  const settings = await getSystemSettings();
  const roles = ["STUDENT", "TEACHER", "STAFF", "BOOK_MANAGER", "REGISTRAR"];

  const [users, sessions, progressRows] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: roles }, isActive: true },
      select: {
        id: true,
        name: true,
        role: true,
        group: true,
        staffPosition: true,
        teacherSubject: true,
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

  // ─── Foydalanuvchi kesimida yig'indilar ────────────────────
  type UserAgg = {
    started: Set<string>;
    completed: Set<string>;
    pagesRead: number;
    seconds: number;
    sessions: number;
  };
  const perUser = new Map<string, UserAgg>();
  const aggOf = (userId: string): UserAgg => {
    let a = perUser.get(userId);
    if (!a) {
      a = { started: new Set(), completed: new Set(), pagesRead: 0, seconds: 0, sessions: 0 };
      perUser.set(userId, a);
    }
    return a;
  };

  for (const s of validSessions) {
    const a = aggOf(s.userId);
    a.started.add(s.bookId);
    a.pagesRead += s.pagesRead;
    a.seconds += s.duration;
    a.sessions += 1;
  }
  for (const r of progressRows) {
    if (r.completedAt) aggOf(r.userId).completed.add(r.bookId);
  }

  const pointsOf = (userId: string): number => {
    const a = perUser.get(userId);
    if (!a) return 0;
    return (
      a.started.size * settings.battleStartPoints +
      a.completed.size * settings.battleCompletePoints
    );
  };

  const teamOf = (role: string): "STUDENT" | "STAFF" =>
    role === "STUDENT" ? "STUDENT" : "STAFF";

  const perTeam = (team: "STUDENT" | "STAFF") => {
    const members = users.filter((u) => teamOf(u.role) === team);
    let pagesRead = 0;
    let readingSeconds = 0;
    let sessionsCount = 0;
    let completed = 0;
    let started = 0;
    const activeUserIds = new Set<string>();
    const points = new Map<string, number>();

    for (const u of members) {
      const a = perUser.get(u.id);
      const p = pointsOf(u.id);
      points.set(u.id, p);
      if (!a) continue;
      pagesRead += a.pagesRead;
      readingSeconds += a.seconds;
      sessionsCount += a.sessions;
      completed += a.completed.size;
      started += a.started.size;
      if (a.sessions > 0) activeUserIds.add(u.id);
    }

    const score = Array.from(points.values()).reduce((x, y) => x + y, 0);

    return {
      team,
      score,
      points,
      teamUsers: members,
      started,
      completed,
      activeUsers: activeUserIds.size,
      pagesRead,
      readingSeconds,
      sessions: sessionsCount,
    };
  };

  const sAgg = perTeam("STUDENT");
  const tAgg = perTeam("STAFF");

  function buildEntry(
    u: (typeof users)[number],
    team: "STUDENT" | "STAFF"
  ): BattleLeaderboardEntry {
    const a = perUser.get(u.id);
    return {
      rank: 0,
      userId: u.id,
      name: u.name,
      role: u.role as BattleLeaderboardEntry["role"],
      group: u.group ?? null,
      position: u.staffPosition ?? u.teacherSubject ?? null,
      avatar: u.avatar ?? null,
      booksStarted: a?.started.size ?? 0,
      booksCompleted: a?.completed.size ?? 0,
      pagesRead: a?.pagesRead ?? 0,
      readingSeconds: a?.seconds ?? 0,
      validSessions: a?.sessions ?? 0,
      points: pointsOf(u.id),
    };
  }

  const leaderboard: BattleLeaderboardEntry[] = [
    ...sAgg.teamUsers.map((u) => buildEntry(u, "STUDENT")),
    ...tAgg.teamUsers.map((u) => buildEntry(u, "STAFF")),
  ]
    .filter((e) => e.points > 0)
    .sort((a, b) => b.points - a.points || b.pagesRead - a.pagesRead)
    .slice(0, 30)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const winner =
    sAgg.score === tAgg.score
      ? "TIE"
      : sAgg.score > tAgg.score
        ? "STUDENT"
        : "STAFF";

  const mkTeam = (agg: ReturnType<typeof perTeam>): BattleTeamStats => {
    let top: BattleTeamStats["topUser"] = null;
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
          staffPosition: u.staffPosition ?? u.teacherSubject,
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
    staff: mkTeam(tAgg),
    winner,
    leaderboard,
  };
}

/** Sessiya davomiyligi "12 daq" formatida. */
export function formatReadable(seconds: number): string {
  if (!seconds || seconds <= 0) return "0 daq";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h} soat ${m > 0 ? `${m} daq` : ""}`.trim();
  return `${m} daq`;
}
