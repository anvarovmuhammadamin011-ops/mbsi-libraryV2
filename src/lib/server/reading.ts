import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { ApiError, ERROR_CODES } from "./errors";
import type {
  ReadingProgress,
  Bookmark,
  Favorite,
  Rating,
  RankingEntry,
  UserStatistics,
  PlatformStatistics,
} from "@/types";
import { MAX_ACTIVE_BOOKS } from "@/lib/validation";
import { getBookStats, toApiBook, bookInclude, type BookStat } from "./books";
import type { BookRow } from "./books";

// ─── Pure helpers (unit-tested) ─────────────────────────────
export function computeProgress(currentPage: number, totalPages: number): number {
  if (!totalPages || totalPages <= 0) return 0;
  const p = (currentPage / totalPages) * 100;
  return Math.min(100, Math.max(0, Math.round(p * 100) / 100));
}

export function computePagesRead(baseline: number, finalMax: number): number {
  return Math.max(0, finalMax - baseline);
}

export function withinActiveLimit(activeCount: number): boolean {
  return activeCount < MAX_ACTIVE_BOOKS;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function computeStreak(sessionDates: Date[]): number {
  if (sessionDates.length === 0) return 0;
  const days = new Set(sessionDates.map((d) => ymd(d)));
  let cursor = new Date();
  // If no activity today, allow streak to still count if active yesterday.
  if (!days.has(ymd(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(ymd(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(ymd(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// ─── Reading progress ───────────────────────────────────────
export async function getActiveCount(userId: string): Promise<number> {
  return prisma.readingProgress.count({
    where: { userId, completedAt: null },
  });
}

export type ProgressRow = Prisma.ReadingProgressGetPayload<{}>;

function toApiProgress(
  row: ProgressRow,
  book?: BookRow,
  stat?: Record<string, BookStat>
): ReadingProgress {
  return {
    id: row.id,
    userId: row.userId,
    bookId: row.bookId,
    book: book
      ? toApiBook(book, stat ? stat[book.id] : undefined)
      : undefined,
    currentPage: row.currentPage,
    totalPages: book?.totalPages ?? row.currentPage,
    progress: row.progress,
    startedAt: row.startedAt.toISOString(),
    lastReadAt: row.lastReadAt.toISOString(),
    completedAt: row.completedAt?.toISOString(),
  };
}

export async function startBook(
  userId: string,
  bookId: string
): Promise<ReadingProgress> {
  const existing = await prisma.readingProgress.findUnique({
    where: { userId_bookId: { userId, bookId } },
  });
  if (existing) return toApiProgress(existing);

  const active = await getActiveCount(userId);
  if (!withinActiveLimit(active)) {
    throw new ApiError(
      ERROR_CODES.BOOK_LIMIT,
      `Bir vaqtning o'zida maksimal ${MAX_ACTIVE_BOOKS} ta kitob o'qishingiz mumkin`,
      409
    );
  }
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);

  const created = await prisma.readingProgress.create({
    data: { userId, bookId, currentPage: 0, progress: 0 },
  });
  return toApiProgress(created);
}

export async function upsertProgress(
  userId: string,
  bookId: string,
  page: number
): Promise<ReadingProgress> {
  const book = await prisma.book.findUnique({ where: { id: bookId }, include: bookInclude });
  if (!book) throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);

  const clamped = Math.max(0, Math.min(page, book.totalPages));
  const progress = computeProgress(clamped, book.totalPages);
  const completed = clamped >= book.totalPages;

  const existing = await prisma.readingProgress.findUnique({
    where: { userId_bookId: { userId, bookId } },
  });

  if (existing) {
    const shouldAward = completed && !existing.completedAt;
    const updated = await prisma.readingProgress.update({
      where: { userId_bookId: { userId, bookId } },
      data: {
        currentPage: clamped,
        progress,
        lastReadAt: new Date(),
        completedAt: completed ? existing.completedAt ?? new Date() : existing.completedAt,
      },
    });
    if (shouldAward) {
      await prisma.user.update({
        where: { id: userId },
        data: { coins: { increment: (book as any).coinReward ?? 10 } },
      });
      // Ball reward for book completion
      const { awardBookRead } = await import("./balls");
      await awardBookRead(userId, bookId);
    }
    return toApiProgress(updated, book);
  }

  const active = await getActiveCount(userId);
  if (!withinActiveLimit(active)) {
    throw new ApiError(
      ERROR_CODES.BOOK_LIMIT,
      `Bir vaqtning o'zida maksimal ${MAX_ACTIVE_BOOKS} ta kitob o'qishingiz mumkin`,
      409
    );
  }
  const created = await prisma.readingProgress.create({
    data: {
      userId,
      bookId,
      currentPage: clamped,
      progress,
      completedAt: completed ? new Date() : null,
    },
  });
  if (completed) {
    await prisma.user.update({
      where: { id: userId },
      data: { coins: { increment: (book as any).coinReward ?? 10 } },
    });
    // Ball reward for book completion
    const { awardBookRead } = await import("./balls");
    await awardBookRead(userId, bookId);
  }
  return toApiProgress(created, book);
}

// ─── Reading sessions (duplicate-page-safe) ─────────────────
export async function startSession(
  userId: string,
  bookId: string,
  startPage: number
): Promise<{ sessionId: string; progress: ReadingProgress }> {
  const progress = await startBook(userId, bookId);
  const baseline = Math.max(
    startPage,
    (progress.currentPage as number) || 0
  );
  const session = await prisma.readingSession.create({
    data: {
      userId,
      bookId,
      startPage,
      baselinePage: baseline,
      endPage: startPage,
    },
  });
  return { sessionId: session.id, progress };
}

export async function endSession(
  sessionId: string,
  userId: string,
  endPage: number
): Promise<{
  pagesRead: number;
  progress: ReadingProgress;
  duration: number;
}> {
  const session = await prisma.readingSession.findUnique({
    where: { id: sessionId },
  });
  if (!session || session.userId !== userId) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, "Sessiya topilmadi", 404);
  }
  const book = await prisma.book.findUnique({ where: { id: session.bookId } });
  if (!book) throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);

  const finalMax = Math.max(session.baselinePage, session.startPage, endPage);
  const pagesRead = computePagesRead(session.baselinePage, finalMax);
  const duration = Math.max(
    0,
    Math.floor((Date.now() - session.startedAt.getTime()) / 1000)
  );

  const updated = await prisma.readingSession.update({
    where: { id: sessionId },
    data: { endPage, pagesRead, duration, endedAt: new Date() },
  });

  const prog = await upsertProgress(userId, book.id, finalMax);

  return { pagesRead: updated.pagesRead, progress: prog, duration: updated.duration };
}

// ─── Continue reading / completed ───────────────────────────
export async function listContinueReading(userId: string, limit = 12) {
  const rows = await prisma.readingProgress.findMany({
    where: { userId, completedAt: null },
    orderBy: { lastReadAt: "desc" },
    take: limit,
  });
  const books = await prisma.book.findMany({
    where: { id: { in: rows.map((r) => r.bookId) } },
    include: bookInclude,
  });
  const stats = await getBookStats(books.map((b) => b.id));
  const byId = new Map(books.map((b) => [b.id, b]));
  return rows
    .map((r) => {
      const b = byId.get(r.bookId);
      return b ? toApiProgress(r, b, stats) : null;
    })
    .filter(Boolean) as ReadingProgress[];
}

export async function listCompleted(userId: string, limit = 50) {
  const rows = await prisma.readingProgress.findMany({
    where: { userId, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    take: limit,
  });
  const books = await prisma.book.findMany({
    where: { id: { in: rows.map((r) => r.bookId) } },
    include: bookInclude,
  });
  const stats = await getBookStats(books.map((b) => b.id));
  const byId = new Map(books.map((b) => [b.id, b]));
  return rows
    .map((r) => {
      const b = byId.get(r.bookId);
      return b ? toApiProgress(r, b, stats) : null;
    })
    .filter(Boolean) as ReadingProgress[];
}

// ─── Bookmarks ──────────────────────────────────────────────
export async function listBookmarks(userId: string, bookId?: string) {
  const rows = await prisma.bookmark.findMany({
    where: bookId ? { userId, bookId } : { userId },
    orderBy: { createdAt: "desc" },
    include: { book: { include: bookInclude } },
  });
  const stats = await getBookStats(rows.map((r) => r.bookId));
  return rows.map(
    (r): Bookmark => ({
      id: r.id,
      userId: r.userId,
      bookId: r.bookId,
      book: r.book ? toApiBook(r.book, stats[r.bookId]) : undefined,
      page: r.page,
      createdAt: r.createdAt.toISOString(),
    })
  );
}

export async function createBookmark(
  userId: string,
  bookId: string,
  page: number,
  note?: string
): Promise<Bookmark> {
  try {
    const r = await prisma.bookmark.create({
      data: { userId, bookId, page, note: note ?? null },
      include: { book: { include: bookInclude } },
    });
    const stats = await getBookStats([r.bookId]);
    return {
      id: r.id,
      userId: r.userId,
      bookId: r.bookId,
      book: r.book ? toApiBook(r.book, stats[r.bookId]) : undefined,
      page: r.page,
      createdAt: r.createdAt.toISOString(),
    };
  } catch (e: any) {
    if (e?.code === "P2002") {
      throw new ApiError(
        ERROR_CODES.CONFLICT,
        "Bu sahifaga bookmark allaqachon qo'shilgan",
        409
      );
    }
    throw e;
  }
}

export async function deleteBookmark(id: string, userId: string): Promise<void> {
  await prisma.bookmark.deleteMany({ where: { id, userId } });
}

// ─── Favorites ──────────────────────────────────────────────
export async function listFavorites(userId: string) {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { book: { include: bookInclude } },
  });
  const stats = await getBookStats(rows.map((r) => r.bookId));
  return rows.map(
    (r): Favorite => ({
      id: r.id,
      userId: r.userId,
      bookId: r.bookId,
      book: r.book ? toApiBook(r.book, stats[r.bookId]) : undefined,
      createdAt: r.createdAt.toISOString(),
    })
  );
}

export async function addFavorite(userId: string, bookId: string): Promise<void> {
  await prisma.favorite.upsert({
    where: { userId_bookId: { userId, bookId } },
    create: { userId, bookId },
    update: {},
  });
}

export async function removeFavorite(userId: string, bookId: string): Promise<void> {
  await prisma.favorite.deleteMany({ where: { userId, bookId } });
}

export async function isFavorite(userId: string, bookId: string): Promise<boolean> {
  const f = await prisma.favorite.findUnique({
    where: { userId_bookId: { userId, bookId } },
  });
  return Boolean(f);
}

// ─── Ratings ────────────────────────────────────────────────
export async function upsertRating(
  userId: string,
  bookId: string,
  rating: number
): Promise<{ average: number; count: number }> {
  await prisma.rating.upsert({
    where: { userId_bookId: { userId, bookId } },
    create: { userId, bookId, rating },
    update: { rating },
  });
  const agg = await prisma.rating.aggregate({
    where: { bookId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return {
    average: Math.round((agg._avg.rating ?? 0) * 100) / 100,
    count: agg._count._all,
  };
}

export async function getUserRating(
  userId: string,
  bookId: string
): Promise<number | null> {
  const r = await prisma.rating.findUnique({
    where: { userId_bookId: { userId, bookId } },
  });
  return r?.rating ?? null;
}

// ─── Ranking ────────────────────────────────────────────────
type RankAgg = {
  userId: string;
  pages: number;
  time: number;
  books: number;
};

async function buildRankData(role: string): Promise<RankAgg[]> {
  const users = await prisma.user.findMany({
    where: { role, isActive: true },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return [];

  const [sess, prog] = await Promise.all([
    prisma.readingSession.groupBy({
      by: ["userId"],
      where: { userId: { in: ids } },
      _sum: { pagesRead: true, duration: true },
    }),
    prisma.readingProgress.groupBy({
      by: ["userId", "bookId"],
      where: { userId: { in: ids } },
      _count: { _all: true },
    }),
  ]);

  const sumMap = new Map<string, { pages: number; time: number }>();
  for (const s of sess) {
    sumMap.set(s.userId, {
      pages: s._sum.pagesRead ?? 0,
      time: s._sum.duration ?? 0,
    });
  }
  const bookCount = new Map<string, number>();
  for (const p of prog) {
    bookCount.set(p.userId, (bookCount.get(p.userId) ?? 0) + 1);
  }

  return ids.map((userId) => ({
    userId,
    pages: sumMap.get(userId)?.pages ?? 0,
    time: sumMap.get(userId)?.time ?? 0,
    books: bookCount.get(userId) ?? 0,
  }));
}

export async function getRanking(role: "STUDENT" | "TEACHER") {
  const data = await buildRankData(role);
  data.sort((a, b) => b.pages - a.pages);
  const users = await prisma.user.findMany({
    where: { id: { in: data.map((d) => d.userId) } },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const entries: RankingEntry[] = data.map((d, i) => {
    const u = userMap.get(d.userId)!;
    return {
      rank: i + 1,
      userId: d.userId,
      user: {
        id: u.id,
        name: u.name,
        role: u.role as any,
        avatar: u.avatar ?? undefined,
        coins: (u as any).coins ?? 0,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      },
      totalPages: d.pages,
      totalBooks: d.books,
      readingTime: Math.round(d.time / 60),
      streak: 0,
    };
  });
  return entries;
}

export async function getUserRank(
  userId: string,
  role: string
): Promise<number> {
  const data = await buildRankData(role);
  data.sort((a, b) => b.pages - a.pages);
  const idx = data.findIndex((d) => d.userId === userId);
  return idx === -1 ? data.length + 1 : idx + 1;
}

// ─── Personal statistics ────────────────────────────────────
export async function getPersonalStats(
  userId: string,
  role: string
): Promise<UserStatistics> {
  const [agg, completed, active, streakDates, rank] = await Promise.all([
    prisma.readingSession.aggregate({
      where: { userId },
      _sum: { pagesRead: true, duration: true },
    }),
    prisma.readingProgress.count({ where: { userId, completedAt: { not: null } } }),
    prisma.readingProgress.count({ where: { userId, completedAt: null } }),
    prisma.readingSession.findMany({
      where: { userId },
      select: { startedAt: true },
    }),
    getUserRank(userId, role),
  ]);

  const dates = streakDates.map((s) => s.startedAt);
  return {
    totalBooks: completed + active,
    totalPages: agg._sum.pagesRead ?? 0,
    readingTime: Math.round((agg._sum.duration ?? 0) / 60),
    currentStreak: computeStreak(dates),
    ranking: rank,
    monthlyPages: 0,
    monthlyBooks: 0,
    monthlyReadingTime: 0,
  };
}

// ─── Platform statistics (admin) ───────────────────────────
export async function getPlatformStats(): Promise<PlatformStatistics> {
  const [totalUsers, totalBooks, totalPages, totalSessions] = await Promise.all([
    prisma.user.count(),
    prisma.book.count({ where: { isPublished: true } }),
    prisma.readingSession.aggregate({ _sum: { pagesRead: true } }),
    prisma.readingSession.count(),
  ]);
  return {
    totalUsers,
    totalBooks,
    totalPagesRead: totalPages._sum.pagesRead ?? 0,
    totalReadingSessions: totalSessions,
    activeStudents: await prisma.user.count({
      where: { role: "STUDENT", isActive: true },
    }),
    activeTeachers: await prisma.user.count({
      where: { role: "TEACHER", isActive: true },
    }),
  };
}
