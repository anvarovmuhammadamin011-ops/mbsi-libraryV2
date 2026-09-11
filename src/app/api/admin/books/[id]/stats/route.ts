import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";

// GET /api/admin/books/[id]/stats — Kitob Menejeri: bitta kitob statistikasi
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireRole("ADMIN");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

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
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  return NextResponse.json({
    book,
    viewsTotal,
    viewsMonth,
    readers,
    avgRating: ratingAgg._avg.rating,
    ratingCount: ratingAgg._count,
    trend: days,
  });
}
