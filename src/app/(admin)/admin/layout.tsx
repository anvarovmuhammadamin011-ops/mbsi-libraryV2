import { requireRole } from "@/lib/server/auth";
import { AdminGuard } from "@/components/admin-guard";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("ADMIN");

  if (!user) {
    return <AdminGuard userRole={null} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
