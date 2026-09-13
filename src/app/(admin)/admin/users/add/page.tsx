import { requireRole } from "@/lib/server/auth";
import { UserCreateForm } from "@/components/user-create-form";

export const dynamic = "force-dynamic";

export default async function AdminUsersAddPage() {
  const admin = await requireRole("ADMIN");
  if (!admin) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Yangi foydalanuvchi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          O&apos;quvchi, o&apos;qituvchi yoki xodimni tizimga qo&apos;shing
        </p>
      </div>
      <UserCreateForm />
    </div>
  );
}