import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { AdminBooksTable } from "@/components/admin-books-table";

export const dynamic = "force-dynamic";

export default async function AdminBooksPage() {
  const user = await requireRole("ADMIN");
  if (!user) return null;

  const [books, categories, authors] = await Promise.all([
    prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        author: { select: { name: true } },
        _count: { select: { ratings: true, progress: true } },
      },
      take: 200,
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.author.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  // Compute average ratings
    const ratingAgg = await prisma.rating.groupBy({
    by: ["bookId"],
    _avg: { rating: true },
  });
  const ratingMap = new Map(ratingAgg.map((r) => [r.bookId, r._avg.rating]));

  const rows = books.map((b) => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
    authorName: b.author?.name ?? "-",
    categoryName: b.category?.name ?? "-",
    language: b.language,
    totalPages: b.totalPages,
    isPublished: b.isPublished,
    readerCount: b._count.progress,
    ratingCount: b._count.ratings,
    averageRating: ratingMap.get(b.id) ?? null,
    createdAt: b.createdAt.toISOString(),
    coverUrl: b.coverUrl ?? "",
  }));

  return (
    <AdminBooksTable
      books={rows}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      authors={authors.map((a) => ({ id: a.id, name: a.name }))}
    />
  );
}
