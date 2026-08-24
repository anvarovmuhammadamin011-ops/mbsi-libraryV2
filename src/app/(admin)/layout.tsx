import { guardPage } from "@/lib/server/guard";

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardPage();
  // No student AppLayout — admin has its own layout inside (admin)/admin/layout.tsx
  return <>{children}</>;
}
