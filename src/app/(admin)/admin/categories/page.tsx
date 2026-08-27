import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { AdminCategoriesView } from "@/components/admin-categories-view";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const user = await requireRole("ADMIN");
  if (!user) return null;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { books: true } },
    },
  });

  const rows = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    icon: c.icon ?? null,
    bookCount: c._count.books,
  }));

  return <AdminCategoriesView categories={rows} />;
}
