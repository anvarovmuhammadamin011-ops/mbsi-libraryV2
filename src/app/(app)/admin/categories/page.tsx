import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { AdminCategories } from "@/components/admin-categories";

export default async function AdminCategoriesPage() {
  const user = await requireRole("TEACHER");
  if (!user) return null;
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { books: true } } },
  });
  return (
    <AdminCategories
      categories={categories.map((c) => ({ id: c.id, name: c.name, bookCount: c._count.books }))}
    />
  );
}
