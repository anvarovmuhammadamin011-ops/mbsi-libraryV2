import { prisma } from "@/lib/db";
import type { RankingEntry } from "@/types";
import { getRanking, computeStreak } from "./reading";

export type DateFilter = "today" | "7d" | "30d" | "all";

export function rangeFromFilter(filter: DateFilter): Date | null {
  if (filter === "all") return null;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (filter === "today") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (filter === "7d") return new Date(now - 7 * day);
  return new Date(now - 30 * day);
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getDashboard(filter: DateFilter) {
  const from = rangeFromFilter(filter);

  const where = from ? { startedAt: { gte: from } } : {};

  const [
    totalUsers,
    totalBooks,
    pagesAgg,
    sessionCount,
    activeStudents,
    activeTeachers,
    completedBooks,
    sessions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.book.count({ where: { isPublished: true } }),
    prisma.readingSession.aggregate({
      where,
      _sum: { pagesRead: true, duration: true },
    }),
    prisma.readingSession.count({ where }),
    prisma.readingSession
      .groupBy({
        by: ["userId"],
        where: { ...where, user: { role: "STUDENT" } },
        _count: { _all: true },
      })
      .then((r) => r.length),
    prisma.readingSession
      .groupBy({
        by: ["userId"],
        where: { ...where, user: { role: "TEACHER" } },
        _count: { _all: true },
      })
      .then((r) => r.length),
    prisma.readingProgress.count({
      where: from ? { completedAt: { gte: from } } : {},
    }),
    prisma.readingSession.findMany({
      where,
      select: { startedAt: true, pagesRead: true, userId: true },
    }),
  ]);

  // ── Graphs: group by day ──
  const days: { date: string; pages: number; users: Set<string> }[] = [];
  const buckets = new Map<string, { pages: number; users: Set<string> }>();
  for (const s of sessions) {
    const key = ymd(s.startedAt);
    if (!buckets.has(key))
      buckets.set(key, { pages: 0, users: new Set() });
    const b = buckets.get(key)!;
    b.pages += s.pagesRead;
    b.users.add(s.userId);
  }
  // Fill last 7 days even if empty
  const dayMs = 24 * 60 * 60 * 1000;
  const count = filter === "today" ? 1 : filter === "7d" ? 7 : filter === "30d" ? 30 : 7;
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * dayMs);
    const key = ymd(d);
    const b = buckets.get(key) ?? { pages: 0, users: new Set() };
    days.push({ date: key, pages: b.pages, users: b.users });
  }

  const topStudents: RankingEntry[] = (await getRanking("STUDENT")).slice(0, 10);
  const topTeachers: RankingEntry[] = (await getRanking("TEACHER")).slice(0, 10);
  await fillStreaks([...topStudents, ...topTeachers]);

  // ── Popular books ──
  const popular = await getPopularBooks(from, 10);

  return {
    cards: {
      totalUsers,
      totalBooks,
      totalPagesRead: pagesAgg._sum.pagesRead ?? 0,
      totalReadingSessions: sessionCount,
      activeStudents,
      activeTeachers,
      completedBooks,
      avgReadingTime: Math.round((pagesAgg._sum.duration ?? 0) / 60),
    },
    graph: days.map((d) => ({
      date: d.date,
      pages: d.pages,
      users: d.users.size,
    })),
    topStudents,
    topTeachers,
    popularBooks: popular,
  };
}

async function fillStreaks(entries: RankingEntry[]) {
  await Promise.all(
    entries.map(async (e) => {
      const dates = await prisma.readingSession.findMany({
        where: { userId: e.userId },
        select: { startedAt: true },
      });
      e.streak = computeStreak(dates.map((d) => d.startedAt));
    })
  );
}

async function getPopularBooks(from: Date | null, limit: number) {
  const where = from ? { startedAt: { gte: from } } : {};
  const agg = await prisma.readingSession.groupBy({
    by: ["bookId"],
    where,
    _sum: { pagesRead: true },
    _count: { _all: true },
  });
  const bookIds = agg.map((a) => a.bookId);
  if (bookIds.length === 0) return [];
  const books = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    select: { id: true, title: true, coverUrl: true, language: true },
  });
  const ratings = await prisma.rating.groupBy({
    by: ["bookId"],
    where: { bookId: { in: bookIds } },
    _avg: { rating: true },
  });
  const ratingMap = new Map(ratings.map((r) => [r.bookId, r._avg.rating ?? 0]));
  const bookMap = new Map(books.map((b) => [b.id, b]));
  return agg
    .map((a) => {
      const b = bookMap.get(a.bookId)!;
      return {
        id: b.id,
        title: b.title,
        coverUrl: b.coverUrl ?? "",
        language: b.language,
        readers: a._count._all,
        pagesRead: a._sum.pagesRead ?? 0,
        rating: Math.round((ratingMap.get(a.bookId) ?? 0) * 100) / 100,
      };
    })
    .sort((a, b) => b.pagesRead - a.pagesRead)
    .slice(0, limit);
}
