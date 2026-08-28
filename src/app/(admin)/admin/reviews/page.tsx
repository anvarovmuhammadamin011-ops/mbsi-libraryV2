import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { AdminReviewsTable } from "@/components/admin-reviews-table";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const admin = await requireRole("ADMIN");
  if (!admin) return null;

  const reviews = await prisma.review.findMany({
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      book: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sharhlar moderatsiyasi</h1>
        <p className="text-sm text-muted-foreground mt-1">Foydalanuvchilar qoldirgan sharhlarni ko&apos;rish, yashirish va o&apos;chirish</p>
      </div>
      <AdminReviewsTable reviews={reviews as any} />
    </div>
  );
}
