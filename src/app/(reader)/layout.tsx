import { guardPage } from "@/lib/server/guard";

export default async function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await guardPage();
  return <>{children}</>;
}
