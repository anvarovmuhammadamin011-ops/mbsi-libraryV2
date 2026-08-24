import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { AdminUsers } from "@/components/admin-users";

export default async function AdminUsersPage() {
  const user = await requireRole("TEACHER");
  if (!user) return null;
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, role: true, isActive: true },
  });
  return (
    <AdminUsers
      currentUserId={user.id}
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        isActive: u.isActive,
      }))}
    />
  );
}
