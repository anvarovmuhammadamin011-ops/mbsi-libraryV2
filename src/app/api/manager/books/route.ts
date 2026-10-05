import { route } from "@/lib/server/handler";
import { requireBookManager } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { bookInclude, getBookStats } from "@/lib/server/books";
import { success } from "@/lib/server/errors";

export const GET = route(async () => {
  const user = await requireBookManager();

  const books = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      ...bookInclude,
      _count: { select: { ratings: true, progress: true } },
    },
    take: 200,
  });

  const ids = books.map((b) => b.id);
  const stats = await getBookStats(ids);

  const data = books.map((b) => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
    authorName: b.author?.name ?? "-",
    categoryName: b.category?.name ?? "-",
    description: b.description ?? "",
    language: b.language,
    totalPages: b.totalPages,
    isPublished: b.isPublished,
    readerCount: b._count.progress,
    ratingCount: b._count.ratings,
    averageRating: stats[b.id]?.avg ?? null,
    createdAt: b.createdAt.toISOString(),
    coverUrl: b.coverUrl ?? "",
  }));

  return success(data);
});

// Kitob yaratish endi yangi /api/books-v2 API'si orqali amalga
// oshiriladi — eski endpoint orqali kelgan POST ham o'sha yerga boradi.
export { POST } from "@/app/api/books-v2/route";
