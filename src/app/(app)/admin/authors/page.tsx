import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { AdminAuthorsView } from "@/components/admin-authors-view";

export const dynamic = "force-dynamic";

export default async function AdminAuthorsPage() {
  const user = await requireRole("ADMIN");
  if (!user) return null;

  const authors = await prisma.author.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { books: true } },
    },
  });

  return (
    <AdminAuthorsView
      authors={authors.map((a) => ({
        id: a.id,
        name: a.name,
        biography: a.biography,
        bookCount: a._count.books,
      }))}
    />
  );
}
