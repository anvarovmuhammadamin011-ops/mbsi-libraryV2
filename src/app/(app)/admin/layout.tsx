import { requireRole } from "@/lib/server/auth";
import { AdminNav } from "@/components/admin-nav";
import { AdminGuard } from "@/components/admin-guard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("ADMIN");

  // If not admin, render forbidden UI (server-side redirect doesn't
  // work reliably in Next.js 16 Turbopack route group layouts).
  if (!user) {
    return <AdminGuard userRole={null} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      <aside className="rounded-xl border bg-card p-3">
        <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Admin panel
        </p>
        <AdminNav />
      </aside>
      <section className="min-w-0">{children}</section>
    </div>
  );
}
