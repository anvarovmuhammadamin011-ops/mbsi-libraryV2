import { guardRegistrar } from "@/lib/server/guard";
import { RegistrarSidebar } from "@/components/registrar-sidebar";

export default async function RegistrarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await guardRegistrar();

  return (
    <div className="flex h-screen overflow-hidden">
      <RegistrarSidebar />
      <main className="flex-1 overflow-y-auto pt-24 lg:pt-0">
        <div className="mx-auto max-w-4xl p-4 pt-2 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
