import { guardPage } from "@/lib/server/guard";

export default async function RegistrarGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardPage();
  return <>{children}</>;
}
