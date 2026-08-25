import { prisma } from "@/lib/db";
import { Stat } from "@/components/ui/stat";
import {
  Users,
  BookMarked,
  BookOpen,
  Clock,
  Activity,
  CheckCircle,
  Star,
  Flame,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { AdminDashboardCharts } from "@/components/admin-dashboard-charts";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalBooks,
    publishedBooks,
    sessions,
    pagesAgg,
    completedProgress,
    avgRating,
    topStudents,
    topTeachers,
    recentSessions,
    activeToday,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.book.count(),
    prisma.book.count({ where: { isPublished: true } }),
    prisma.readingSession.count(),
    prisma.readingProgress.aggregate({ _sum: { currentPage: true } }),
    prisma.readingProgress.count({ where: { completedAt: { not: null } } }),
    prisma.rating.aggregate({ _avg: { rating: true } }),
    prisma.readingProgress.groupBy({
      by: ["userId"],
      _sum: { currentPage: true },
      _count: { id: true },
      orderBy: { _sum: { currentPage: "desc" } },
      take: 5,
    }),
    prisma.readingSession.groupBy({
      by: ["userId"],
      _sum: { pagesRead: true, duration: true },
      _count: { id: true },
      orderBy: { _sum: { pagesRead: "desc" } },
      take: 5,
    }),
    prisma.readingSession.findMany({
      orderBy: { startedAt: "desc" },
      take: 8,
      include: { user: { select: { name: true } }, book: { select: { title: true } } },
    }),
    prisma.readingSession.findMany({
      where: {
        startedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  // Fetch user names for top students
  const topStudentUsers = await prisma.user.findMany({
    where: { id: { in: topStudents.map((s) => s.userId) } },
    select: { id: true, name: true },
  });
  const studentMap = new Map(topStudentUsers.map((u) => [u.id, u.name]));

  // Fetch user names for top teachers
  const topTeacherUsers = await prisma.user.findMany({
    where: { id: { in: topTeachers.map((t) => t.userId) } },
    select: { id: true, name: true },
  });
  const teacherMap = new Map(topTeacherUsers.map((u) => [u.id, u.name]));

  // Get reading activity data for the chart (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dailySessions = await prisma.readingSession.groupBy({
    by: ["startedAt"],
    _sum: { pagesRead: true },
    _count: { id: true },
    where: { startedAt: { gte: sevenDaysAgo } },
    orderBy: { startedAt: "asc" },
  });

  // Build daily chart data
  const chartData: { day: string; pages: number; readers: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString("uz-UZ", { weekday: "short" });
    const dayStart = new Date(d.setHours(0, 0, 0, 0));
    const dayEnd = new Date(d.setHours(23, 59, 59, 999));
    const daySessions = dailySessions.filter((s) => {
      const dt = new Date(s.startedAt);
      return dt >= dayStart && dt <= dayEnd;
    });
    chartData.push({
      day: dayStr,
      pages: daySessions.reduce((sum, s) => sum + (s._sum.pagesRead ?? 0), 0),
      readers: daySessions.reduce((sum, s) => sum + s._count.id, 0),
    });
  }

  const totalPages = pagesAgg._sum.currentPage ?? 0;
  const totalReadingHours = Math.round(
    (await prisma.readingSession.aggregate({ _sum: { duration: true } }))._sum
      .duration ?? 0 / 3600
  );
  const durationAgg = await prisma.readingSession.aggregate({
    _sum: { duration: true },
  });
  const totalHours = Math.round((durationAgg._sum.duration ?? 0) / 3600);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Boshqaruv paneli</h1>
        <p className="text-sm text-muted-foreground mt-1">
          MBSI Library umumiy ko&apos;rinishi
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat
          label="Jami foydalanuvchilar"
          value={totalUsers.toLocaleString()}
          icon={<Users className="size-5" />}
        />
        <Stat
          label="Jami kitoblar"
          value={totalBooks.toLocaleString()}
          icon={<BookMarked className="size-5" />}
        />
        <Stat
          label="O'qilgan sahifa"
          value={totalPages.toLocaleString()}
          icon={<BookOpen className="size-5" />}
        />
        <Stat
          label="O'qish vaqti"
          value={`${totalHours} soat`}
          icon={<Clock className="size-5" />}
        />
        <Stat
          label="Faol o'quvchilar"
          value={activeToday.length.toLocaleString()}
          icon={<Activity className="size-5" />}
        />
        <Stat
          label="Yakunlangan kitoblar"
          value={completedProgress.toLocaleString()}
          icon={<CheckCircle className="size-5" />}
        />
        <Stat
          label="O'rtacha reyting"
          value={avgRating._avg.rating ? avgRating._avg.rating.toFixed(1) : "—"}
          icon={<Star className="size-5" />}
        />
        <Stat
          label="O'qish sessiyalari"
          value={sessions.toLocaleString()}
          icon={<TrendingUp className="size-5" />}
        />
      </div>

      {/* Charts */}
      <AdminDashboardCharts data={chartData} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Students */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">🏆 Eng faol o&apos;quvchilar</h2>
            <Link href="/admin/ratings" className="text-xs font-medium text-primary hover:underline">
              Barchasini ko&apos;rish
            </Link>
          </div>
          <div className="space-y-2">
            {topStudents.map((s, i) => (
              <div
                key={s.userId}
                className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/50 transition-colors"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                    i === 0
                      ? "bg-gradient-to-br from-yellow-400 to-amber-500"
                      : i === 1
                        ? "bg-gradient-to-br from-gray-300 to-gray-400"
                        : i === 2
                          ? "bg-gradient-to-br from-orange-300 to-orange-400"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {(studentMap.get(s.userId) ?? "?").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{studentMap.get(s.userId) ?? "Noma'lum"}</p>
                  <p className="text-xs text-muted-foreground">{s._count.id} sessiya</p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {(s._sum.currentPage ?? 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Teachers */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">👨‍🏫 Eng faol o&apos;qituvchilar</h2>
            <Link href="/admin/ratings" className="text-xs font-medium text-primary hover:underline">
              Barchasini ko&apos;rish
            </Link>
          </div>
          <div className="space-y-2">
            {topTeachers.map((t, i) => (
              <div
                key={t.userId}
                className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/50 transition-colors"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                    i === 0
                      ? "bg-gradient-to-br from-yellow-400 to-amber-500"
                      : i === 1
                        ? "bg-gradient-to-br from-gray-300 to-gray-400"
                        : i === 2
                          ? "bg-gradient-to-br from-orange-300 to-orange-400"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {(teacherMap.get(t.userId) ?? "?").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{teacherMap.get(t.userId) ?? "Noma'lum"}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((t._sum.duration ?? 0) / 60)} daqiqa o&apos;qish
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {(t._sum.pagesRead ?? 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">So&apos;nggi faoliyat</h2>
        <div className="space-y-3">
          {recentSessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                <BookOpen size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{s.user?.name ?? "Noma'lum"}</span>
                  {" "}
                  <span className="font-medium">{s.book?.title ?? "bir"}</span>
                  {" "}kitobini o&apos;qidi
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.pagesRead} sahifa · {Math.round(s.duration / 60)} daqiqa
                </p>
              </div>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(s.startedAt).toLocaleTimeString("uz-UZ", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
