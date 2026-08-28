import { getSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { LibraryTabs, type ReadingItem, type SavedItem, type FinishedItem } from "@/components/library-tabs";
import { ReadingJourneyCard } from "@/components/reading-journey-card";
import { getUserAchievements } from "@/lib/server/achievements";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [readingRows, favoriteRows, finishedRows, sessions, recentSessions, achievements, pagesAgg] = await Promise.all([
    prisma.readingProgress.findMany({
      where: { userId: user.id, completedAt: null },
      include: { book: { include: { author: true } } },
      orderBy: { lastReadAt: "desc" },
    }),
    prisma.favorite.findMany({
      where: { userId: user.id },
      include: { book: { include: { author: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.readingProgress.findMany({
      where: { userId: user.id, completedAt: { not: null } },
      include: { book: { include: { author: true } } },
      orderBy: { completedAt: "desc" },
    }),
    prisma.readingSession.findMany({
      where: { userId: user.id },
      select: { startedAt: true, duration: true },
      orderBy: { startedAt: "desc" },
    }),
    prisma.readingSession.findMany({
      where: {
        userId: user.id,
        startedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      select: { duration: true },
    }),
    getUserAchievements(user.id),
    prisma.readingProgress.aggregate({
      where: { userId: user.id },
      _sum: { currentPage: true },
    }),
  ]);

  // Reading stats
  const booksCompleted = finishedRows.length;

  // Calculate streak (consecutive days with reading sessions)
  const uniqueDays = new Set(
    sessions.map((s) => new Date(s.startedAt).toDateString())
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (uniqueDays.has(d.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  // Total reading time this month (in seconds → formatted)
  const monthSeconds = recentSessions.reduce((sum, s) => sum + s.duration, 0);
  const hours = Math.floor(monthSeconds / 3600);
  const minutes = Math.floor((monthSeconds % 3600) / 60);

  const reading: ReadingItem[] = readingRows
    .filter((r) => r.book)
    .map((r) => ({
      id: r.id,
      progress: r.progress,
      currentPage: r.currentPage,
      book: {
        id: r.book.id,
        title: r.book.title,
        slug: r.book.slug,
        coverUrl: r.book.coverUrl,
        authorName: r.book.author?.name ?? null,
      },
    }));

  const saved: SavedItem[] = favoriteRows
    .filter((f) => f.book)
    .map((f) => ({
      id: f.id,
      book: {
        id: f.book.id,
        title: f.book.title,
        slug: f.book.slug,
        coverUrl: f.book.coverUrl,
        authorName: f.book.author?.name ?? null,
      },
    }));

  const finished: FinishedItem[] = finishedRows
    .filter((r) => r.book)
    .map((r) => ({
      id: r.id,
      progress: r.progress,
      book: {
        id: r.book.id,
        title: r.book.title,
        slug: r.book.slug,
        coverUrl: r.book.coverUrl,
        authorName: r.book.author?.name ?? null,
      },
    }));

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0 max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your reading journey in one place</p>
      </div>

      {/* 📌 Reading Journey Stats — tablet+ */}
      <ReadingJourneyCard
        booksCompleted={booksCompleted}
        streak={streak}
        monthHours={hours}
        monthMinutes={minutes}
      />

      {/* Statistics — Phase 4 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-muted/50 p-3 text-center">
          <p className="text-lg font-bold text-foreground">{readingRows.length + finishedRows.length}</p>
          <p className="text-xs text-muted-foreground">Books started</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-3 text-center">
          <p className="text-lg font-bold text-foreground">{finishedRows.length}</p>
          <p className="text-xs text-muted-foreground">Books completed</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-3 text-center">
          <p className="text-lg font-bold text-foreground">{(pagesAgg._sum.currentPage ?? 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Pages read</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-3 text-center">
          <p className="text-lg font-bold text-foreground">{Math.floor(sessions.reduce((s, x) => s + (x.duration ?? 0), 0) / 60)}m</p>
          <p className="text-xs text-muted-foreground">Reading time</p>
        </div>
      </div>

      {/* Achievements — Phase 4 */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">🏆 Achievements</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl border p-3 text-center ${a.unlocked ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900" : "bg-muted/30 border-border opacity-60"}`}
            >
              <div className="text-2xl mb-1">{a.icon}</div>
              <p className="text-xs font-semibold text-foreground">{a.title}</p>
              <p className="text-[11px] text-muted-foreground">{a.description}</p>
              <p className="text-xs font-medium text-primary mt-1">{a.progress}</p>
            </div>
          ))}
        </div>
      </div>

      <LibraryTabs reading={reading} saved={saved} finished={finished} />
    </div>
  );
}
