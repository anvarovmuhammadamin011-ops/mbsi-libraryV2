import { prisma } from "@/lib/db";
import { AdminDashboardTabs } from "@/components/admin-dashboard-tabs";
import { getDiagnosticsData } from "@/lib/server/diagnostics";

export const dynamic = "force-dynamic";

const DAY = 86400000;

export default async function AdminDashboard() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalBooks,
    publishedBooks,
    durationAgg,
    completedProgress,
    inProgressCount,
    topStudents,
    topTeachers,
    activeToday,
    weeklyActive,
    mostReadAgg,
    mostSavedAgg,
    popularCats,
    newUsersLast30Days,
    newUsersLast7Days,
    usersCreated,
    thirtyDaySessions,
    monthlySessions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.book.count(),
    prisma.book.count({ where: { isPublished: true } }),
    prisma.readingSession.aggregate({ _sum: { duration: true, pagesRead: true } }),
    prisma.readingProgress.count({ where: { completedAt: { not: null } } }),
    prisma.readingProgress.count({ where: { completedAt: null } }),
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
      where: { startedAt: { gte: todayStart } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.readingSession.findMany({
      where: { startedAt: { gte: sevenDaysAgo } },
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
      take: 6,
    }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.readingSession.findMany({
      where: { startedAt: { gte: thirtyDaysAgo } },
      select: { startedAt: true, pagesRead: true },
    }),
    prisma.readingSession.findMany({
      where: { startedAt: { gte: sixMonthsAgo } },
      select: {
        startedAt: true,
        book: { select: { category: { select: { name: true } } } },
      },
    }),
  ]);

  // ─── User name maps ─────────────────────────────────────────
  const [studentUsers, teacherUsers] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: topStudents.map((s) => s.userId) } },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { id: { in: topTeachers.map((t) => t.userId) } },
      select: { id: true, name: true },
    }),
  ]);
  const studentMap = new Map(studentUsers.map((u) => [u.id, u.name]));
  const teacherMap = new Map(teacherUsers.map((u) => [u.id, u.name]));

  // ─── Daily data (last 30 days) — single pass over sessions ──
  const days: { date: string; label: string; sessions: number; pages: number; users: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY);
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" }),
      sessions: 0,
      pages: 0,
      users: 0,
    });
  }
  const dayIndex = new Map(days.map((d, i) => [d.date, i]));
  for (const s of thirtyDaySessions) {
    const idx = dayIndex.get(s.startedAt.toISOString().slice(0, 10));
    if (idx !== undefined) {
      days[idx].sessions++;
      days[idx].pages += s.pagesRead;
    }
  }
  for (const u of usersCreated) {
    const idx = dayIndex.get(u.createdAt.toISOString().slice(0, 10));
    if (idx !== undefined) days[idx].users++;
  }

  // ─── Peak reading hours (last 30 days) ──────────────────────
  const hours = new Array(24).fill(0);
  for (const s of thirtyDaySessions) hours[s.startedAt.getHours()]++;
  const peakHoursData = hours.map((value, hour) => ({
    hour: `${String(hour).padStart(2, "0")}:00`,
    sessions: value,
  }));

  // ─── Monthly reading growth (last 6 months) ─────────────────
  const months: { key: string; label: string; sessions: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("uz-UZ", { month: "short" }),
      sessions: 0,
    });
  }
  const monthIndex = new Map(months.map((m, i) => [m.key, i]));
  for (const s of monthlySessions) {
    const key = `${s.startedAt.getFullYear()}-${String(s.startedAt.getMonth() + 1).padStart(2, "0")}`;
    const idx = monthIndex.get(key);
    if (idx !== undefined) months[idx].sessions++;
  }

  // ─── Top genres this month + formats ────────────────────────
  const genreCounts: Record<string, number> = {};
  for (const s of monthlySessions) {
    const name = s.book?.category?.name ?? "Noma'lum";
    genreCounts[name] = (genreCounts[name] ?? 0) + 1;
  }
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, sessions]) => ({ name, sessions }));

  const [pdfBooks, audioBooks] = await Promise.all([
    prisma.book.count({ where: { pdfUrl: { not: null } } }),
    prisma.book.count({ where: { pdfUrl: null } }),
  ]);
  const formatData = [
    { name: "PDF", value: pdfBooks },
    { name: "Audio", value: audioBooks },
  ];

  // ─── Category donut (books + read share) ────────────────────
  const categoryDonut = popularCats.map((c) => ({
    name: c.name,
    books: c._count.books,
    reads: 0,
  }));
  const catNameById = new Map(popularCats.map((c) => [c.id, c.name]));
  const progressByCat: Record<string, number> = {};
  // reading sessions joined via book → category (already have monthlySessions for 6 months; count distinct per category is fine as "reads")
  for (const s of monthlySessions) {
    const name = s.book?.category?.name;
    if (name) progressByCat[name] = (progressByCat[name] ?? 0) + 1;
  }
  for (const d of categoryDonut) d.reads = progressByCat[d.name] ?? 0;

  // ─── Recent activity — filter + group consecutive ───────────
  const rawRecent = await prisma.readingSession.findMany({
    orderBy: { startedAt: "desc" },
    take: 60,
    include: { user: { select: { name: true } }, book: { select: { title: true } } },
  });
  const groupedRecent: {
    id: string;
    userId: string;
    bookId: string;
    userName: string;
    bookTitle: string;
    count: number;
    pages: number;
    minutes: number;
    startedAt: Date;
  }[] = [];
  for (const s of rawRecent) {
    if (s.pagesRead <= 0 && s.duration <= 0) continue; // filter 0-sessions
    const last = groupedRecent[groupedRecent.length - 1];
    const same = last && last.userId === s.userId && last.bookId === s.bookId;
    if (same) {
      last.count++;
      last.pages += s.pagesRead;
      last.minutes += Math.round(s.duration / 60);
    } else {
      groupedRecent.push({
        id: s.id,
        userId: s.userId,
        bookId: s.bookId,
        userName: s.user?.name ?? "Noma'lum",
        bookTitle: s.book?.title ?? "bir",
        count: 1,
        pages: s.pagesRead,
        minutes: Math.round(s.duration / 60),
        startedAt: s.startedAt,
      });
    }
  }
  const recentActivity = groupedRecent.slice(0, 8);

  // ─── KPI cards ──────────────────────────────────────────────
  const totalMinutes = Math.round((durationAgg._sum.duration ?? 0) / 60);
  const activeUsers = activeToday.length;
  const totalPages = durationAgg._sum.pagesRead ?? 0;
  const avgMinutesPerUser =
    activeUsers > 0 ? Math.round(totalMinutes / activeUsers) : 0;

  const summaryCards = [
    {
      label: "Kunlik faol (DAU)",
      value: activeToday.length.toLocaleString(),
      sub: "Bugun o'qiganlar",
      accent: "blue" as const,
    },
    {
      label: "Haftalik faol (WAU)",
      value: weeklyActive.length.toLocaleString(),
      sub: "7 kun ichida",
      accent: "emerald" as const,
    },
    {
      label: "O'rtacha o'qish vaqti",
      value: `${avgMinutesPerUser} daq`,
      sub: `${activeUsers} faol foydalanuvchi`,
      accent: "violet" as const,
    },
    {
      label: "Tugatilgan kitoblar",
      value: completedProgress.toLocaleString(),
      sub: `${inProgressCount} jarayonda`,
      accent: "amber" as const,
    },
    {
      label: "Yangi a'zolar (30 kun)",
      value: newUsersLast30Days.toLocaleString(),
      sub: `+${newUsersLast7Days} bu hafta`,
      accent: "rose" as const,
    },
    {
      label: "Jami foydalanuvchilar",
      value: totalUsers.toLocaleString(),
      sub: `${totalStudents} o'quvchi · ${totalTeachers} o'qituvchi`,
      accent: "slate" as const,
    },
  ];

  const topReadersData = topStudents.map((r) => ({
    name: studentMap.get(r.userId)?.split(" ")[0] ?? "Noma'lum",
    pages: r._sum.currentPage ?? 0,
    sessions: r._count.id,
  }));

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

  const diagnosticsData = await getDiagnosticsData();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Boshqaruv paneli</h1>
        <p className="text-sm text-muted-foreground mt-1">
          MBSI Library umumiy ko&apos;rinishi · real vaqt rejimida
        </p>
      </div>

      <AdminDashboardTabs
        summaryCards={summaryCards}
        dailyData={days}
        peakHoursData={peakHoursData}
        monthlyGrowthData={months}
        categoryDonut={categoryDonut}
        formatData={formatData}
        topGenres={topGenres}
        userStatusData={[
          { name: "Faol", value: activeUsers, color: "#10B981" },
          { name: "Nofaol", value: Math.max(0, totalUsers - activeUsers), color: "#94A3B8" },
        ]}
        topReadersData={topReadersData}
        topStudents={topStudents.map((s) => ({
          name: studentMap.get(s.userId) ?? "Noma'lum",
          sessions: s._count.id,
          pages: s._sum.currentPage ?? 0,
        }))}
        topTeachers={topTeachers.map((t) => ({
          name: teacherMap.get(t.userId) ?? "Noma'lum",
          sessions: t._count.id,
          pages: t._sum.pagesRead ?? 0,
          minutes: Math.round((t._sum.duration ?? 0) / 60),
        }))}
        mostRead={mostReadAgg.map((r, i) => ({
          rank: i + 1,
          title: mostReadMap.get(r.bookId) ?? r.bookId,
          count: r._count.bookId,
        }))}
        mostSaved={mostSavedAgg.map((r, i) => ({
          rank: i + 1,
          title: mostSavedMap.get(r.bookId) ?? r.bookId,
          count: r._count.bookId,
        }))}
        popularCats={popularCats.map((c, i) => ({
          rank: i + 1,
          icon: c.slug,
          name: c.name,
          books: c._count.books,
        }))}
        recentActivity={recentActivity}
        totalBooks={totalBooks}
        publishedBooks={publishedBooks}
        totalPages={totalPages}
        totalMinutes={totalMinutes}
        diagnostics={diagnosticsData}
      />
    </div>
  );
}