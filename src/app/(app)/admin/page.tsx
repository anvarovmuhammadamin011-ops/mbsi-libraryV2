import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { BookMarked, Users, BookOpen, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [books, users, sessions, pagesAgg] = await Promise.all([
    prisma.book.count(),
    prisma.user.count(),
    prisma.readingSession.count(),
    prisma.readingProgress.aggregate({ _sum: { currentPage: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin panel</h1>
        <p className="text-sm text-muted-foreground">Kutubxona boshqaruvi</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Kitoblar" value={books.toLocaleString()} icon={<BookMarked className="size-5" />} />
        <Stat label="Foydalanuvchilar" value={users.toLocaleString()} icon={<Users className="size-5" />} />
        <Stat label="O'qish sessiyalari" value={sessions.toLocaleString()} icon={<Activity className="size-5" />} />
        <Stat label="O'qilgan sahifa" value={(pagesAgg._sum.currentPage ?? 0).toLocaleString()} icon={<BookOpen className="size-5" />} />
      </div>
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          Kitoblarni boshqarish uchun{" "}
          <Link href="/admin/books" className="text-primary hover:underline">Kitoblar</Link>{" "}
          bo'limiga o'ting.
        </p>
      </Card>
    </div>
  );
}
