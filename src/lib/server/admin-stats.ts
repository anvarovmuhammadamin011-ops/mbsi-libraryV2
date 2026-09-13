import { prisma } from "@/lib/db";
import { getSystemSettings } from "./system-settings";

const DAY_MS = 86400000;

export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>;

/**
 * Butun tizim statistikasi — ADMIN dashboardining markazi.
 * Kitob menejeri dashboardi (kitob/kontent statistikasi) bilan takrorlanmaydi:
 * bu yerda faqat foydalanuvchilar va o'qish faoliyati.
 */
export async function getAdminStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const monthAgo = new Date(now.getTime() - 30 * DAY_MS);

  const settings = await getSystemSettings();
  const minPages = Math.max(0, settings.minPagesPerRead);
  const minSeconds = Math.max(0, settings.minSecondsPerRead);

  const [
    roleCounts,
    activeUserCount,
    totalCompleted,
    totalBooks,
    sessionsAgg,
    todayLogins,
    todaySessionsOpen,
    todaySessions,
    todayCompleted,
    weekNew,
    monthNew,
    sessions7d,
    sessions30dUsers,
    login30dUsers,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.readingProgress.count({ where: { completedAt: { not: null } } }),
    prisma.book.count({ where: { status: "ACTIVE", isPublished: true } }),
    prisma.readingSession.aggregate({
      _sum: { pagesRead: true, duration: true },
      _count: { _all: true },
    }),
    prisma.user.count({ where: { lastLoginAt: { gte: todayStart } } }),
    prisma.readingSession.count({ where: { startedAt: { gte: todayStart } } }),
    prisma.readingSession.count({
      where: {
        startedAt: { gte: todayStart },
        pagesRead: { gte: minPages },
        duration: { gte: minSeconds },
      },
    }),
    prisma.readingProgress.count({
      where: { completedAt: { gte: todayStart } },
    }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.readingSession.findMany({
      where: { startedAt: { gte: weekAgo } },
      select: { startedAt: true, userId: true, pagesRead: true, duration: true },
    }),
    prisma.readingSession.groupBy({
      by: ["userId"],
      where: { startedAt: { gte: monthAgo } },
    }),
    prisma.user.findMany({
      where: { lastLoginAt: { gte: monthAgo } },
      select: { id: true },
    }),
  ]);

  const roleMap = new Map(roleCounts.map((r) => [r.role, r._count._all]));
  const students = roleMap.get("STUDENT") ?? 0;
  const teachers = roleMap.get("TEACHER") ?? 0;
  const staff =
    (roleMap.get("ADMIN") ?? 0) +
    (roleMap.get("BOOK_MANAGER") ?? 0) +
    (roleMap.get("REGISTRAR") ?? 0) +
    (roleMap.get("STAFF") ?? 0);
  const totalUsers = students + teachers + staff;

  // Faol foydalanuvchilar = oxirgi 30 kunda o'qish sessiyasi yoki login qilgan
  const activeSet = new Set(sessions30dUsers.map((r) => r.userId));
  for (const u of login30dUsers) activeSet.add(u.id);
  const activeUsers = activeSet.size;

  // 7 kunlik grafik
  const days = new Map<string, { users: Set<string>; sessions: number; completed: number }>();
  const dayDate: { date: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    days.set(key, { users: new Set(), sessions: 0, completed: 0 });
    dayDate.push({
      date: key,
      label: d.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" }),
    });
  }
  for (const s of sessions7d) {
    const key = s.startedAt.toISOString().slice(0, 10);
    const b = days.get(key);
    if (!b) continue;
    b.users.add(s.userId);
    b.sessions++;
  }
  const completed7d = await prisma.readingProgress.findMany({
    where: { completedAt: { gte: weekAgo } },
    select: { completedAt: true },
  });
  for (const c of completed7d) {
    const key = c.completedAt!.toISOString().slice(0, 10);
    const b = days.get(key);
    if (b) b.completed++;
  }
  const graph = dayDate.map(({ date, label }) => {
    const b = days.get(date)!;
    return { date, label, users: b.users.size, sessions: b.sessions, completed: b.completed };
  });

  // O'quvchi vs O'qituvchi
  const comparison = await teamComparison(minPages, minSeconds, monthAgo);

  return {
    totals: {
      totalUsers,
      students,
      teachers,
      staff,
      activeUsers,
      totalSessions: sessionsAgg._count._all ?? 0,
      totalPagesRead: sessionsAgg._sum.pagesRead ?? 0,
      totalCompleted,
      totalBooks,
      newThisWeek: weekNew,
      newThisMonth: monthNew,
    },
    today: {
      logins: todayLogins,
      booksOpened: todaySessionsOpen,
      booksRead: todaySessions,
      booksCompleted: todayCompleted,
    },
    graph,
    comparison,
  };
}

async function teamComparison(minPages: number, minSeconds: number, monthAgo: Date) {
  const [aggregate, progressAgg] = await Promise.all([
    prisma.readingSession.groupBy({
      by: ["userId"],
      where: {
        startedAt: { gte: monthAgo },
        pagesRead: { gte: minPages },
        duration: { gte: minSeconds },
      },
      _sum: { pagesRead: true, duration: true },
      _count: { _all: true },
    }),
    prisma.readingProgress.groupBy({
      by: ["userId"],
      where: { completedAt: { gte: monthAgo } },
      _count: { _all: true },
    }),
  ]);

  const aggMap = new Map(
    aggregate.map((r) => [
      r.userId,
      {
        sessions: r._count._all,
        pages: r._sum.pagesRead ?? 0,
        seconds: r._sum.duration ?? 0,
      },
    ])
  );
  const completeMap = new Map(
    progressAgg.map((r) => [r.userId, r._count._all])
  );

  const userIds = Array.from(aggMap.keys());
  const users =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, role: true, group: true, staffPosition: true },
        })
      : [];

  const perRole = (role: "STUDENT" | "TEACHER") => {
    const rel = users.filter((u) => u.role === role);
    let sessions = 0;
    let pages = 0;
    let seconds = 0;
    let completed = 0;
    let top: { id: string; name: string; group: string | null; position: string | null; pages: number; books: number } | null = null;
    for (const u of rel) {
      const a = aggMap.get(u.id)!;
      sessions += a.sessions;
      pages += a.pages;
      seconds += a.seconds;
      completed += completeMap.get(u.id) ?? 0;
      if (!top || a.pages > top.pages) {
        top = {
          id: u.id,
          name: u.name,
          group: u.group,
          position: u.staffPosition,
          pages: a.pages,
          books: completeMap.get(u.id) ?? 0,
        };
      }
    }
    return {
      activeUsers: rel.length,
      totalReads: sessions,
      totalPagesRead: pages,
      readingSeconds: seconds,
      totalCompleted: completed,
      avgReads: rel.length > 0 ? sessions / rel.length : 0,
      top,
    };
  };

  return { student: perRole("STUDENT"), teacher: perRole("TEACHER") };
}