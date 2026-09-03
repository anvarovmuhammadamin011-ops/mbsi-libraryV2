import { prisma } from "@/lib/db";
import type { Book } from "@/types";
import { toApiBook, type BookRow, bookInclude } from "./books";

export type AiRecommendation = {
  book: Book;
  reason: string;
};

function getCategoryReason(categoryName: string): string {
  return `Siz ${categoryName} kitoblarini ko'p o'qigansiz. Shu kitoblar sizga yoqishi mumkin.`;
}

export async function getAiRecommendations(userId: string, limit = 6): Promise<AiRecommendation[]> {
  // Collect user's activity
  const [progress, favorites, ratings, sessions] = await Promise.all([
    prisma.readingProgress.findMany({ where: { userId }, include: { book: { include: { category: true } } } }),
    prisma.favorite.findMany({ where: { userId }, include: { book: { include: { category: true } } } }),
    prisma.rating.findMany({ where: { userId }, include: { book: { include: { category: true } } } }),
    prisma.readingSession.findMany({ where: { userId }, include: { book: { include: { category: true } } } }),
  ]);

  const categoryCount: Record<string, { name: string; count: number }> = {};
  const readBookIds = new Set<string>();

  const add = (book: any) => {
    if (!book) return;
    readBookIds.add(book.id);
    const cat = book.category;
    if (cat) {
      const key = cat.id;
      if (!categoryCount[key]) categoryCount[key] = { name: cat.name, count: 0 };
      categoryCount[key].count += 1;
    }
  };

  for (const p of progress) add((p as any).book);
  for (const f of favorites) add((f as any).book);
  for (const r of ratings) add((r as any).book);
  for (const s of sessions) add((s as any).book);

  const sortedCats = Object.entries(categoryCount).sort((a, b) => b[1].count - a[1].count);
  const topCategory = sortedCats[0]?.[1]?.name;
  const topCategoryId = sortedCats[0]?.[0];

  // If no history, fallback to popular books
  if (!topCategoryId) {
    const popular = await prisma.book.findMany({
      where: { isPublished: true },
      include: { author: true, category: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return popular.map((b) => ({
      book: toApiBook(b as BookRow),
      reason: "Yangi va mashhur kitoblar",
    }));
  }

  // Find books in top category not yet read
  const candidates = await prisma.book.findMany({
    where: {
      categoryId: topCategoryId,
      isPublished: true,
      id: { notIn: Array.from(readBookIds) },
    },
    include: { author: true, category: true },
    take: limit * 2,
  });

  const recommendations: AiRecommendation[] = candidates.slice(0, limit).map((b) => ({
    book: toApiBook(b as BookRow),
    reason: getCategoryReason(topCategory!),
  }));

  // If not enough, fill with highly rated books outside category
  if (recommendations.length < limit) {
    const filler = await prisma.book.findMany({
      where: { isPublished: true, id: { notIn: [...Array.from(readBookIds), ...recommendations.map((r) => r.book.id)] } },
      include: { author: true, category: true, ratings: true },
      take: limit - recommendations.length,
    });
    // Sort filler by avg rating
    const withAvg = await Promise.all(
      filler.map(async (b) => {
        const agg = await prisma.rating.aggregate({ where: { bookId: b.id }, _avg: { rating: true } });
        return { book: b, avg: agg._avg.rating ?? 0 };
      })
    );
    withAvg.sort((a, b) => b.avg - a.avg);
    for (const { book } of withAvg) {
      recommendations.push({ book: toApiBook(book as BookRow), reason: "Ko'p o'quvchilar yuqori baholagan" });
    }
  }

  return recommendations.slice(0, limit);
}

export async function getSmartDiscoverySections(userId: string) {
  const recs = await getAiRecommendations(userId, 6);
  const progress = await prisma.readingProgress.findMany({
    where: { userId, completedAt: null },
    include: { book: { include: { category: true } } },
    orderBy: { lastReadAt: "desc" },
    take: 3,
  });

  // Group recs by category for "Because you read X"
  const byCategory: Record<string, AiRecommendation[]> = {};
  for (const r of recs) {
    const cat = r.book.category?.name ?? "Umumiy";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(r);
  }

  const topCat = Object.keys(byCategory)[0];
  return {
    becauseYouRead: topCat ? { category: topCat, books: byCategory[topCat].slice(0, 4) } : null,
    continueJourney: progress.length > 0 ? progress.slice(0, 3) : null,
    youMayAlsoLike: recs.slice(0, 4),
  };
}
