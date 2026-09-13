import { requireRole } from "@/lib/server/auth";
import { AdminUsersView } from "@/components/admin-users-view";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = await requireRole("ADMIN");
  if (!admin) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Foydalanuvchilar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            O&apos;quvchilar, o&apos;qituvchilar va xodimlarni boshqarish
          </p>
        </div>
      </div>
      <AdminUsersView />
    </div>
  );
}