import { guardBookManager } from "@/lib/server/guard";
import { ManagerSidebar } from "@/components/manager-sidebar";

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await guardBookManager();

  return (
    <div className="flex h-screen overflow-hidden">
      <ManagerSidebar />
      <main className="flex-1 overflow-y-auto pt-24 lg:pt-0">
        <div className="mx-auto max-w-7xl p-4 pt-2 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
