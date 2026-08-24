import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { AdminUsersTable } from "@/components/admin-users-table";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await requireRole("ADMIN");
  if (!user) return null;

  const [users, totalStudents, totalTeachers, totalAdmins] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            progress: true,
            sessions: true,
          },
        },
      },
      take: 200,
    }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  // Get pages read per user
  const pagesAgg = await prisma.readingProgress.groupBy({
    by: ["userId"],
    _sum: { currentPage: true },
  });
  const pagesMap = new Map(pagesAgg.map((p) => [p.userId, p._sum.currentPage ?? 0]));

  // Get reading time per user
  const timeAgg = await prisma.readingSession.groupBy({
    by: ["userId"],
    _sum: { duration: true },
  });
  const timeMap = new Map(timeAgg.map((t) => [t.userId, t._sum.duration ?? 0]));

  const rows = users.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    bookCount: u._count.progress,
    sessionCount: u._count.sessions,
    totalPages: pagesMap.get(u.id) ?? 0,
    readingTime: timeMap.get(u.id) ?? 0,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <AdminUsersTable
      users={rows}
      currentUserId={user.id}
      stats={{
        total: users.length,
        students: totalStudents,
        teachers: totalTeachers,
        admins: totalAdmins,
      }}
    />
  );
}
