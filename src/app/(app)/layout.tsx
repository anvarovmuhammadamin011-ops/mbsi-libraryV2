import { guardPage } from "@/lib/server/guard";
import { AppLayout } from "@/components/layout/app-layout";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardPage();
  return <AppLayout>{children}</AppLayout>;
}
