import { prisma } from "@/lib/db";
import {
  Users,
  BookMarked,
  BookOpen,
  Clock,
  Activity,
  CheckCircle,
  Star,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { AdminDashboardCharts } from "@/components/admin-dashboard-charts";
import { getSmartInsights } from "@/lib/server/insights";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

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
    mostReadAgg,
    mostSavedAgg,
    popularCats,
    activeUsers,
    inactiveUsers,
    newUsersLast30Days,
    newUsersLast7Days,
    userGrowth,
    topReadersAgg,
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
      where: { startedAt: { gte: todayStart } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.readingProgress.groupBy({
      by: ["bookId"],
      _count: { bookId: true },
      orderBy: { _count: { bookId: "desc" } },
      take: 5,
    }),
    prisma.favorite.groupBy({
      by: ["bookId"],
      _count: { bookId: true },
      orderBy: { _count: { bookId: "desc" } },
      take: 5,
    }),
    prisma.category.findMany({
      include: { _count: { select: { books: true } } },
      orderBy: { books: { _count: "desc" } },
      take: 5,
    }),
    // Active users (have at least one reading session)
    prisma.user.count({
      where: { sessions: { some: {} } },
    }),
    // Inactive users (no reading sessions)
    prisma.user.count({
      where: { sessions: { none: {} } },
    }),
    // New users in last 30 days
    prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    // New users in last 7 days
    prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    // User growth data for last 30 days
    prisma.user.groupBy({
      by: ["createdAt"],
      _count: { id: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "asc" },
    }),
    // Top readers (most pages read)
    prisma.readingSession.groupBy({
      by: ["userId"],
      _sum: { pagesRead: true },
      _count: { id: true },
      orderBy: { _sum: { pagesRead: "desc" } },
      take: 5,
    }),
  ]);

  const insights = await getSmartInsights();

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

  // Fetch user names for top readers
  const topReaderUsers = await prisma.user.findMany({
    where: { id: { in: topReadersAgg.map((r) => r.userId) } },
    select: { id: true, name: true },
  });
  const topReadersMap = new Map(topReaderUsers.map((u) => [u.id, u.name]));

  const mostReadBooks = await prisma.book.findMany({
    where: { id: { in: mostReadAgg.map((r) => r.bookId) } },
    select: { id: true, title: true },
  });
  const mostReadMap = new Map(mostReadBooks.map((b) => [b.id, b.title]));
  const mostSavedBooks = await prisma.book.findMany({
    where: { id: { in: mostSavedAgg.map((r) => r.bookId) } },
    select: { id: true, title: true },
  });
  const mostSavedMap = new Map(mostSavedBooks.map((b) => [b.id, b.title]));

  // Build daily chart data for last 30 days
  const dailyData: { date: string; label: string; users: number; sessions: number; pages: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
    const dayStart = new Date(d.setHours(0, 0, 0, 0));
    const dayEnd = new Date(d.setHours(23, 59, 59, 999));

    // Count new users on this day
    const newUsers = userGrowth.filter((u) => {
      const dt = new Date(u.createdAt);
      return dt >= dayStart && dt <= dayEnd;
    }).reduce((sum, u) => sum + u._count.id, 0);

    // Count sessions on this day
    const daySessions = await prisma.readingSession.count({
      where: { startedAt: { gte: dayStart, lte: dayEnd } },
    });

    // Count pages read on this day
    const dayPages = await prisma.readingSession.aggregate({
      _sum: { pagesRead: true },
      where: { startedAt: { gte: dayStart, lte: dayEnd } },
    });

    dailyData.push({
      date: dateStr,
      label,
      users: newUsers,
      sessions: daySessions,
      pages: dayPages._sum.pagesRead ?? 0,
    });
  }

  // User status data for pie chart
  const userStatusData = [
    { name: "Faol", value: activeUsers, color: "#10B981" },
    { name: "Nofaol", value: inactiveUsers, color: "#94A3B8" },
  ];

  // Top readers data for bar chart
  const topReadersData = topReadersAgg.map((r) => ({
    name: topReadersMap.get(r.userId)?.split(" ")[0] ?? "Noma'lum",
    pages: r._sum.pagesRead ?? 0,
    sessions: r._count.id,
  }));

  const totalPages = pagesAgg._sum.currentPage ?? 0;
  const durationAgg = await prisma.readingSession.aggregate({
    _sum: { duration: true },
  });
  const totalHours = Math.round((durationAgg._sum.duration ?? 0) / 3600);

  // Summary cards data
  const summaryCards = [
    {
      label: "Jami foydalanuvchilar",
      value: totalUsers.toLocaleString(),
      icon: <Users className="size-5" />,
      change: `+${newUsersLast7Days}`,
      changeType: "positive" as const,
    },
    {
      label: "Jami kitoblar",
      value: totalBooks.toLocaleString(),
      icon: <BookMarked className="size-5" />,
    },
    {
      label: "Bugungi faollik",
      value: activeToday.length.toLocaleString(),
      icon: <Activity className="size-5" />,
    },
    {
      label: "Yangi a'zolar (30 kun)",
      value: newUsersLast30Days.toLocaleString(),
      icon: <UserPlus className="size-5" />,
      change: `+${newUsersLast7Days} haftalik`,
      changeType: "positive" as const,
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Boshqaruv paneli</h1>
        <p className="text-sm text-muted-foreground mt-1">
          MBSI Library umumiy ko&apos;rinishi
        </p>
      </div>

      {/* Charts with Summary Cards */}
      <AdminDashboardCharts
        summaryCards={summaryCards}
        dailyData={dailyData}
        userStatusData={userStatusData}
        topReadersData={topReadersData}
      />

      {/* Analytics — Phase 4: Most Read / Most Saved / Popular Categories */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">📚 Eng ko'p o'qilgan kitoblar</h2>
          <div className="space-y-2">
            {mostReadAgg.length === 0 ? (
              <p className="text-sm text-muted-foreground">Hali ma&apos;lumot yo&apos;q</p>
            ) : (
              mostReadAgg.map((r, i) => (
                <div key={r.bookId} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 truncate">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="truncate max-w-[150px]">{mostReadMap.get(r.bookId) ?? r.bookId}</span>
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">{r._count.bookId} marta</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">🔖 Eng ko'p saqlangan kitoblar</h2>
          <div className="space-y-2">
            {mostSavedAgg.length === 0 ? (
              <p className="text-sm text-muted-foreground">Hali saqlangan kitob yo&apos;q</p>
            ) : (
              mostSavedAgg.map((r, i) => (
                <div key={r.bookId} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 truncate">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold text-amber-600">
                      {i + 1}
                    </span>
                    <span className="truncate max-w-[150px]">{mostSavedMap.get(r.bookId) ?? r.bookId}</span>
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">{r._count.bookId} marta</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">🗂️ Mashhur kategoriyalar</h2>
          <div className="space-y-2">
            {popularCats.length === 0 ? (
              <p className="text-sm text-muted-foreground">Hali kategoriya yo&apos;q</p>
            ) : (
              popularCats.map((c, i) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 truncate">
                    <span className="text-base">{c.icon ?? "📁"}</span>
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">{c._count.books} kitob</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ✨ Smart Insights — Phase 5 */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          ✨ Smart Insights <span className="text-xs font-normal text-muted-foreground">AI tahlili</span>
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {insights.map((ins, i) => (
            <div key={i} className="rounded-xl bg-card border border-border p-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">{ins.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{ins.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{ins.description}</p>
                  {ins.trend && (
                    <span className="inline-flex mt-2 rounded-full bg-green-50 dark:bg-green-950/30 px-2 py-0.5 text-xs font-medium text-green-600">
                      {ins.trend}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
