import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/server/auth";
import {
  BookOpen,
  Clock,
  Flame,
  Trophy,
  TrendingUp,
  Calendar,
  Target,
  BarChart3,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const sessionUser = await getSessionUser();
  const userId = sessionUser?.id;

  // Total pages
  const pagesAgg = userId
    ? await prisma.readingProgress.aggregate({
        where: { userId },
        _sum: { currentPage: true },
      })
    : { _sum: { currentPage: 0 } };

  // Completed books
  const completedBooks = userId
    ? await prisma.readingProgress.count({
        where: { userId, completedAt: { not: null } },
      })
    : 0;

  // Currently reading
  const currentlyReading = userId
    ? await prisma.readingProgress.count({
        where: { userId, completedAt: null },
      })
    : 0;

  // Total sessions
  const sessions = userId
    ? await prisma.readingSession.findMany({
        where: { userId },
        select: { startedAt: true, pagesRead: true },
        orderBy: { startedAt: "desc" },
      })
    : [];

  // Calculate reading time (minutes)
  const totalMinutes = sessions.reduce((sum, s) => sum + s.pagesRead * 1, 0); // ~1 min per page

  // Streak
  let streakDays = 0;
  if (sessions.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDates = [...new Set(sessions.map((s) => new Date(s.startedAt).toDateString()))];
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (sessionDates.includes(d.toDateString())) {
        streakDays++;
      } else if (i > 0) {
        break;
      }
    }
  }

  // Pages per day for chart (last 7 days)
  const daysData: { label: string; pages: number }[] = [];
  const dayNames = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);
    const dayPages = sessions
      .filter((s) => {
        const sd = new Date(s.startedAt);
        return sd >= d && sd < nextD;
      })
      .reduce((sum, s) => sum + s.pagesRead, 0);
    daysData.push({
      label: dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1],
      pages: dayPages,
    });
  }

  const maxPages = Math.max(...daysData.map((d) => d.pages), 1);

  // Books being read
  const readingBooks = userId
    ? await prisma.readingProgress.findMany({
        where: { userId, completedAt: null },
        include: { book: { select: { title: true, slug: true, totalPages: true } } },
        orderBy: { lastReadAt: "desc" },
        take: 5,
      })
    : [];

  const totalPages = pagesAgg._sum.currentPage ?? 0;

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-0">
      <div>
        <h1 className="text-xl font-bold text-foreground">📊 Statistika</h1>
        <p className="text-sm text-muted-foreground mt-1">
          O&apos;qish faoliyatingizning batafsil ko&apos;rinishi
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} className="text-primary" />
            <span className="text-[10px] text-muted-foreground">Tugatilgan</span>
          </div>
          <p className="text-xl font-bold text-foreground">{completedBooks}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-green-600" />
            <span className="text-[10px] text-muted-foreground">Sahifalar</span>
          </div>
          <p className="text-xl font-bold text-foreground">{totalPages.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-blue-600" />
            <span className="text-[10px] text-muted-foreground">O&apos;qish vaqti</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {totalMinutes >= 60
              ? `${Math.floor(totalMinutes / 60)} soat ${totalMinutes % 60} daq`
              : `${totalMinutes} daq`}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={14} className="text-orange-600" />
            <span className="text-[10px] text-muted-foreground">Ketma-ketlik</span>
          </div>
          <p className="text-xl font-bold text-foreground">{streakDays} kun</p>
        </div>
      </div>

      {/* Reading Activity Chart */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">📈 O&apos;qish faolligi</h2>
        </div>
        <div className="flex items-end gap-2 h-32">
          {daysData.map((d, i) => {
            const height = d.pages > 0 ? Math.max((d.pages / maxPages) * 100, 8) : 4;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-muted-foreground">
                  {d.pages > 0 ? d.pages : ""}
                </span>
                <div className="w-full flex items-end" style={{ height: "100px" }}>
                  <div
                    className="w-full rounded-t-md bg-primary transition-all duration-500"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Currently Reading */}
      {readingBooks.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">📖 Hozir o&apos;qilayotganlar</h2>
          </div>
          <div className="space-y-3">
            {readingBooks.map((p) => {
              const total = p.book.totalPages || 320;
              const pct = Math.round((p.currentPage / total) * 100);
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {p.book.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {p.currentPage}/{total} · {pct}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly summary */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">📅 Oylik xulosa</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Jami sessiyalar</p>
            <p className="text-lg font-bold text-foreground">{sessions.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">O&apos;rtacha sahifa/sessiya</p>
            <p className="text-lg font-bold text-foreground">
              {sessions.length > 0
                ? Math.round(totalPages / sessions.length)
                : 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Hozir o&apos;qilayotgan</p>
            <p className="text-lg font-bold text-foreground">{currentlyReading}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tugatilgan</p>
            <p className="text-lg font-bold text-foreground">{completedBooks}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
