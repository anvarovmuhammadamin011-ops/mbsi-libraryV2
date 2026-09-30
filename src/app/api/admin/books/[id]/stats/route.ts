import { route, json } from "@/lib/server/handler";
import { requireBookManager } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES } from "@/lib/server/errors";

// GET /api/admin/books/[id]/stats — Kitob Menejeri: bitta kitob statistikasi
export const GET = route(async (_req, ctx) => {
  const admin = await requireBookManager();
  if (!admin) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, "Ruxsat yo'q", 403);
  }
  const { id } = await ctx.params;

  const book = await prisma.book.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
  });
  if (!book) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, "Kitob topilmadi", 404);
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const [viewsTotal, viewsMonth, readers, ratingAgg, sessions] =
    await Promise.all([
      prisma.readingSession.count({ where: { bookId: id } }),
      prisma.readingSession.count({
        where: { bookId: id, startedAt: { gte: monthStart } },
      }),
      prisma.readingProgress.count({ where: { bookId: id } }),
      prisma.rating.aggregate({
        where: { bookId: id },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.readingSession.findMany({
        where: { bookId: id, startedAt: { gte: thirtyDaysAgo } },
        select: { startedAt: true },
      }),
    ]);

  // 30 kunlik trend
  const days: { date: string; label: string; views: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" }),
      views: 0,
    });
  }
  const idx = new Map(days.map((d, i) => [d.date, i]));
  for (const s of sessions) {
    const i = idx.get(s.startedAt.toISOString().slice(0, 10));
    if (i !== undefined) days[i].views++;
  }

  return json({
    book,
    viewsTotal,
    viewsMonth,
    readers,
    avgRating: ratingAgg._avg.rating,
    ratingCount: ratingAgg._count,
    trend: days,
  });
});
