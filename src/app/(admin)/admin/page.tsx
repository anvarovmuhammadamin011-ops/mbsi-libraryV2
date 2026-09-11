import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  Users,
  UserCheck,
  BookMarked,
  BookOpen,
  Activity,
  UserPlus,
  Star,
  TrendingUp,
  Flame,
  Clock,
} from "lucide-react";
import { AdminActivityChart } from "@/components/admin-activity-chart";

export const dynamic = "force-dynamic";

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0 daq";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h} soat${m > 0 ? ` ${m} daq` : ""}`;
  return `${m} daq`;
}

export default async function AdminDashboard() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalStudents,
    activeStudents,
    completedBooks,
    totalBooks,
    todayActive,
    newThisWeek,
    pendingCount,
    topBookAgg,
    topStudentAgg,
    avgAgg,
    sessions30,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "STUDENT", isActive: true } }),
    prisma.readingProgress.count({ where: { completedAt: { not: null } } }),
    prisma.book.count({ where: { status: "ACTIVE" } }),
    prisma.readingSession.findMany({
      where: { startedAt: { gte: todayStart } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.user.count({
      where: { role: "STUDENT", createdAt: { gte: weekAgo } },
    }),
    prisma.pendingStudent.count({ where: { status: "PENDING" } }),
    prisma.readingSession.groupBy({
      by: ["bookId"],
      _count: { bookId: true },
      orderBy: { _count: { bookId: "desc" } },
      take: 5,
    }),
    prisma.readingSession.groupBy({
      by: ["userId"],
      _sum: { pagesRead: true },
      orderBy: { _sum: { pagesRead: "desc" } },
      take: 5,
    }),
    prisma.readingSession.aggregate({ _avg: { pagesRead: true, duration: true } }),
    prisma.readingSession.findMany({
      where: { startedAt: { gte: new Date(now.getTime() - 30 * 86400000) } },
      select: { startedAt: true },
    }),
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
      sub: `+${newThisWeek} shu hafta`,
      icon: Users,
      href: "/admin/students",
      color: "text-primary",
    },
    {
      label: "Faol o'quvchilar",
      value: activeStudents,
      sub: "tizimga kirish huquqi bor",
      icon: UserCheck,
      href: "/admin/students",
      color: "text-green-600",
    },
    {
      label: "Tugatilgan kitoblar",
      value: completedBooks,
      sub: "oxirgi g'oyacha",
      icon: BookOpen,
      href: undefined,
      color: "text-orange-500",
    },
    {
      label: "Jami kitoblar",
      value: totalBooks,
      sub: "faol kutubxonada",
      icon: BookMarked,
      href: undefined,
      color: "text-violet-600",
    },
    {
      label: "Bugun faol",
      value: todayActive.length,
      sub: "o'quvchi o'qidi",
      icon: Activity,
      href: undefined,
      color: "text-blue-600",
    },
    {
      label: "Yangi o'quvchilar",
      value: newThisWeek,
      sub: "shu hafta qo'shildi",
      icon: UserPlus,
      href: "/admin/students/pending",
      color: "text-amber-600",
    },
  ];

  // 30 kunlik o'qish faolligi
  const days: { date: string; label: string; sessions: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" }),
      sessions: 0,
    });
  }
  const idx = new Map(days.map((d, i) => [d.date, i]));
  for (const s of sessions30) {
    const i = idx.get(s.startedAt.toISOString().slice(0, 10));
    if (i !== undefined) days[i].sessions++;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Boshqaruv paneli</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Maktab kutubxonasidan hozir qanday foydalanilyapti — bir qarashda
        </p>
      </div>

      {/* ─── KPI kartalar ─── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => {
          const Icon = s.icon;
          const inner = (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground leading-snug">
                  {s.label}
                </p>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/60 ${s.color}`}>
                  <Icon size={16} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {s.value.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{s.sub}</p>
            </>
          );
          return s.href ? (
            <Link
              key={s.label}
              href={s.href}
              className="rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-md"
            >
              {inner}
            </Link>
          ) : (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              {inner}
            </div>
          );
        })}
      </div>

      {/* ─── O'quvchilar statistikasi ─── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            <h2 className="text-base font-semibold">O'qish faolligi (30 kun)</h2>
          </div>
          <AdminActivityChart data={days} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Flame size={16} className="text-primary" />
            <h2 className="text-base font-semibold">O'rtacha faollik</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen size={15} /> Sessiyaga sahifa
              </div>
              <span className="text-lg font-bold tabular-nums">
                {Math.round(avgAgg._avg.pagesRead ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={15} /> Sessiya davomiyligi
              </div>
              <span className="text-lg font-bold tabular-nums">
                {Math.round((avgAgg._avg.duration ?? 0) / 60)} daq
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity size={15} /> Bugungi sessiyalar
              </div>
              <span className="text-lg font-bold tabular-nums">
                {sessions30.filter((s) => s.startedAt >= todayStart).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users size={15} /> Bugun faol o'quvchilar
              </div>
              <span className="text-lg font-bold tabular-nums">
                {todayActive.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tasdiqlash kutilmoqda ─── */}
      {pendingCount > 0 && (
        <Link
          href="/admin/students/pending"
          className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 font-medium text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-300"
        >
          <UserPlus size={18} />
          {pendingCount} ta yangi o&apos;quvchi tasdiqlashni kutmoqda →
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── Eng ko'p o'qilgan kitoblar (Top 5) ─── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Star size={16} className="text-primary" />
              Eng ko&apos;p o&apos;qilgan kitoblar
            </h2>
          </div>
          {topBookAgg.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              📚 Hozircha o&apos;qish statistikasi yo&apos;q
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
                        {b?.title ?? "—"}
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

        {/* ─── Eng faol o'quvchilar (Top 5) ─── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Users size={16} className="text-primary" />
              Eng faol o&apos;quvchilar
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
                        {u?.name ?? "—"}
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
