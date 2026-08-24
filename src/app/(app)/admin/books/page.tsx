import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { AdminBooks } from "@/components/admin-books";

export default async function AdminBooksPage() {
  const user = await requireRole("TEACHER");
  if (!user) return null;

  const [books, categories] = await Promise.all([
    prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true, author: true },
      take: 200,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const rows = books.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author?.name ?? "-",
    totalPages: b.totalPages,
    categoryId: b.categoryId,
    categoryName: b.category?.name ?? "-",
  }));

  return (
    <AdminBooks
      books={rows}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
