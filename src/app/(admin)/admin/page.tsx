import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  Users,
  BookMarked,
  Tags,
  BookPlus,
  UserPlus,
  UserCheck,
  Bell,
  TriangleAlert,
  Plus,
  Eye,
  Star,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  const [
    totalStudents,
    totalBooks,
    totalCategories,
    newBooksMonth,
    newUsersMonth,
    topBookAgg,
    topStudentAgg,
    draftBooks,
    newUsersWeek,
    pendingCount,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.book.count({ where: { isPublished: true } }),
    prisma.category.count(),
    prisma.book.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.user.count({
      where: { role: "STUDENT", createdAt: { gte: monthStart } },
    }),
    prisma.readingSession.groupBy({
      by: ["bookId"],
      _count: { bookId: true },
      orderBy: { _count: { bookId: "desc" } },
      take: 5,
    }),
    prisma.readingSession.groupBy({
      by: ["userId"],
      _sum: { pagesRead: true },
      _count: { id: true },
      orderBy: { _sum: { pagesRead: "desc" } },
      take: 10,
    }),
    prisma.book.count({ where: { isPublished: false } }),
    prisma.user.count({
      where: { role: "STUDENT", createdAt: { gte: weekAgo } },
    }),
    prisma.pendingStudent.count({ where: { status: "PENDING" } }),
  ]);

  const [topBooks, topUsers] = await Promise.all([
    topBookAgg.length
      ? prisma.book.findMany({
          where: { id: { in: topBookAgg.map((r) => r.bookId) } },
          select: { id: true, title: true, author: { select: { name: true } } },
        })
      : [],
    topStudentAgg.length
      ? prisma.user.findMany({
          where: { id: { in: topStudentAgg.map((r) => r.userId) } },
          select: { id: true, name: true, group: true },
        })
      : [],
  ]);
  const bookMap = new Map(topBooks.map((b) => [b.id, b]));
  const userMap = new Map(topUsers.map((u) => [u.id, u]));

  const stats = [
    {
      label: "Jami o'quvchilar",
      value: totalStudents,
      sub: `+${newUsersMonth} bu oy`,
      icon: Users,
      href: "/admin/students",
    },
    {
      label: "Jami kitoblar",
      value: totalBooks,
      sub: `+${newBooksMonth} bu oy`,
      icon: BookMarked,
      href: "/admin/books",
    },
    {
      label: "Jami kategoriyalar",
      value: totalCategories,
      sub: "barcha bo'limlar",
      icon: Tags,
      href: "/admin/categories",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Boshqaruv paneli</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Asosiy statistika va tezkor amallar
        </p>
      </div>

      {/* ─── A) Umumiy statistika ─── */}
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </p>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={18} />
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums">
                {s.value.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
            </Link>
          );
        })}
      </div>

      {/* ─── C) Admin bildirishnomalari ─── */}
      {(pendingCount > 0 || newUsersWeek > 0 || draftBooks > 0) && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Bell size={16} className="text-primary" />
            <h2 className="text-base font-semibold">Bildirishnomalar</h2>
          </div>
          <ul className="space-y-2 text-sm">
            {pendingCount > 0 && (
              <li>
                <Link
                  href="/admin/students/pending"
                  className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 font-medium text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300"
                >
                  <TriangleAlert size={15} />
                  {pendingCount} ta yangi o&apos;quvchi tasdiqlanishni kutmoqda
                </Link>
              </li>
            )}
            {newUsersWeek > 0 && (
              <li className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                <UserPlus size={15} />
                Bu hafta {newUsersWeek} ta yangi o&apos;quvchi qo&apos;shildi
              </li>
            )}
            {draftBooks > 0 && (
              <li>
                <Link
                  href="/admin/books"
                  className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-300"
                >
                  <Eye size={15} />
                  {draftBooks} ta kitob nashr qilinmagan (draft)
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* ─── D) Quick actions ─── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-semibold">Tezkor amallar</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/students/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={16} /> Yangi o&apos;quvchi
          </Link>
          <Link
            href="/admin/books"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <BookPlus size={16} /> Yangi kitob
          </Link>
          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            <Plus size={16} /> Yangi kategoriya
          </Link>
          <Link
            href="/admin/students"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            <Users size={16} /> O&apos;quvchilar
          </Link>
          <Link
            href="/admin/students/pending"
            className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
              pendingCount > 0
                ? "border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
                : "border-border hover:bg-muted"
            }`}
          >
            <UserCheck size={16} /> Kutilayotganlar
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white">
                {pendingCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── Eng ko'p o'qilgan kitoblar (Top 5) ─── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp size={16} className="text-primary" />
              Eng ko&apos;p o&apos;qilgan (Top 5)
            </h2>
            <Link
              href="/admin/books"
              className="text-xs font-medium text-primary hover:underline"
            >
              Barchasi
            </Link>
          </div>
          {topBookAgg.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Hali o&apos;qish statistikasi yo&apos;q
            </p>
          ) : (
            <ol className="space-y-2.5">
              {topBookAgg.map((r, i) => {
                const b = bookMap.get(r.bookId);
                return (
                  <li key={r.bookId} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {b?.title ?? r.bookId}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {b?.author?.name ?? "—"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                      {r._count.bookId} o&apos;qish
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* ─── Eng faol o'quvchilar (Top 10) ─── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Star size={16} className="text-primary" />
              Eng faol o&apos;quvchilar (Top 10)
            </h2>
            <Link
              href="/admin/students"
              className="text-xs font-medium text-primary hover:underline"
            >
              Barchasi
            </Link>
          </div>
          {topStudentAgg.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Hali faollik statistikasi yo&apos;q
            </p>
          ) : (
            <ol className="space-y-2.5">
              {topStudentAgg.map((r, i) => {
                const u = userMap.get(r.userId);
                return (
                  <li key={r.userId} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {u?.name ?? r.userId}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u?.group ?? "—"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                      {(r._sum.pagesRead ?? 0).toLocaleString()} bet
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
