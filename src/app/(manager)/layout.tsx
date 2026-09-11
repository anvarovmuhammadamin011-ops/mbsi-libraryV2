import { guardPage } from "@/lib/server/guard";

export default async function ManagerGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardPage();
  return <>{children}</>;
}
