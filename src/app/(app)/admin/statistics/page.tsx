import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { Stat } from "@/components/ui/stat";
import { BarChart3, Users, BookOpen, Clock, TrendingUp, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminStatisticsPage() {
  const user = await requireRole("ADMIN");
  if (!user) return null;

  const [
    totalPages,
    totalSessions,
    completedBooks,
    avgSessionDuration,
    activeUsersThisWeek,
    newUsersThisMonth,
  ] = await Promise.all([
    prisma.readingProgress.aggregate({ _sum: { currentPage: true } }),
    prisma.readingSession.count(),
    prisma.readingProgress.count({ where: { completedAt: { not: null } } }),
    prisma.readingSession.aggregate({ _avg: { duration: true } }),
    prisma.user.count({
      where: {
        sessions: { some: { startedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      },
    }),
    prisma.user.count({
      where: {
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
  ]);

  const totalHours = Math.round((avgSessionDuration._avg.duration ?? 0) / 3600);
  const totalPagesRead = totalPages._sum.currentPage ?? 0;

  // Most read books
  const topBooks = await prisma.readingProgress.groupBy({
    by: ["bookId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const bookIds = topBooks.map((b) => b.bookId);
  const bookDetails = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    select: { id: true, title: true, totalPages: true },
  });
  const bookMap = new Map(bookDetails.map((b) => [b.id, b]));

  // Least read books (published but 0 readers)
  const leastRead = await prisma.book.findMany({
    where: {
      isPublished: true,
      progress: { none: {} },
    },
    select: { id: true, title: true },
    take: 5,
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Statistics</h1>
        <p className="text-sm text-muted-foreground mt-1">Detailed MBSI Library analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Total Pages Read" value={totalPagesRead.toLocaleString()} icon={<BookOpen className="size-5" />} />
        <Stat label="Reading Sessions" value={totalSessions.toLocaleString()} icon={<BarChart3 className="size-5" />} />
        <Stat label="Completed Books" value={completedBooks.toLocaleString()} icon={<CheckCircle className="size-5" />} />
        <Stat label="Active Users (7d)" value={activeUsersThisWeek.toLocaleString()} icon={<Users className="size-5" />} />
        <Stat label="New Users (this month)" value={newUsersThisMonth.toLocaleString()} icon={<TrendingUp className="size-5" />} />
        <Stat label="Avg Session" value={`${totalHours}h`} icon={<Clock className="size-5" />} />
      </div>

      {/* Most Read Books */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">Most Read Books</h2>
        <div className="space-y-2">
          {topBooks.map((b, i) => {
            const book = bookMap.get(b.bookId);
            return (
              <div key={b.bookId} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/50 transition-colors">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{book?.title ?? "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{book?.totalPages ?? 0} pages</p>
                </div>
                <p className="text-sm font-semibold text-primary">{b._count.id} readers</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Least Read */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">Least Read (0 readers)</h2>
        {leastRead.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">All published books have readers!</p>
        ) : (
          <div className="space-y-2">
            {leastRead.map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/50 transition-colors">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-xs font-bold text-red-500">
                  !
                </div>
                <p className="text-sm font-medium">{b.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
