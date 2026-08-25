import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/server/auth";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Flame,
  Bell,
  Target,
  TrendingUp,
  Star,
  ArrowRight,
  Headphones,
  Trophy,
  Coins,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sessionUser = await getSessionUser();
  const userId = sessionUser?.id;

  // Get user data
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : null;

  // Get reading progress
  const readingProgress = userId
    ? await prisma.readingProgress.findMany({
        where: { userId, completedAt: null },
        include: { book: { include: { author: true } } },
        orderBy: { lastReadAt: "desc" },
        take: 3,
      })
    : [];

  // Get total pages read
  const pagesAgg = userId
    ? await prisma.readingProgress.aggregate({
        where: { userId },
        _sum: { currentPage: true },
      })
    : { _sum: { currentPage: 0 } };

  // Get completed books
  const completedBooks = userId
    ? await prisma.readingProgress.count({
        where: { userId, completedAt: { not: null } },
      })
    : 0;

  // Get streak (simple: count consecutive days with sessions)
  const streak = userId
    ? await prisma.readingSession.findMany({
        where: { userId },
        select: { startedAt: true },
        orderBy: { startedAt: "desc" },
      })
    : [];

  // Calculate streak
  let streakDays = 0;
  if (streak.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDates = [...new Set(
      streak.map(s => new Date(s.startedAt).toDateString())
    )];
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

  // Get unread notifications count
  const notificationCount = 3; // Demo

  // Get active missions count
  const missionCount = 2; // Demo

  // Get total coins (demo)
  const coins = 450;

  // Get newest books
  const recommendedBooks = await prisma.book.findMany({
    where: { isPublished: true },
    include: { author: true, ratings: { select: { rating: true } } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  // Get trending books (most sessions)
  const trendingIds = await prisma.readingSession.groupBy({
    by: ["bookId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });
  const trendingBooks = trendingIds.length > 0
    ? await prisma.book.findMany({
        where: { id: { in: trendingIds.map((t) => t.bookId) } },
        include: { author: true },
      })
    : [];

  // Daily goal (demo: 18/30)
  const todayPages = userId
    ? await prisma.readingSession.findMany({
        where: {
          userId,
          startedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        select: { pagesRead: true },
      })
    : [];
  const todayTotal = todayPages.reduce((sum, s) => sum + s.pagesRead, 0);
  const dailyGoal = 30;
  const goalPercent = Math.min(Math.round((todayTotal / dailyGoal) * 100), 100);

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-0">
      {/* Welcome Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Assalomu alaykum, {user?.name?.split(" ")[0] || "O'quvchi"}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bugun ham bir necha sahifa o&apos;qib, maqsadingizga yaqinlashing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-yellow-50 dark:bg-yellow-950/30 px-3 py-1.5">
            <Coins size={14} className="text-yellow-600" />
            <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{coins}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-orange-50 dark:bg-orange-950/30 px-3 py-1.5">
            <Flame size={14} className="text-orange-600" />
            <span className="text-sm font-bold text-orange-700 dark:text-orange-400">{streakDays}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 relative">
            <Bell size={14} className="text-primary" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                {notificationCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Daily Goal */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target size={18} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Bugungi maqsad</h2>
        </div>
        <div className="flex items-end justify-between mb-2">
          <div>
            <span className="text-3xl font-bold text-foreground">{todayTotal}</span>
            <span className="text-sm text-muted-foreground"> / {dailyGoal} sahifa</span>
          </div>
          <span className="text-sm font-medium text-primary">{goalPercent}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${goalPercent}%` }}
          />
        </div>
        {goalPercent < 100 ? (
          <p className="text-xs text-muted-foreground mt-2">
            Yana {dailyGoal - todayTotal} sahifa o&apos;qing!
          </p>
        ) : (
          <p className="text-xs text-green-600 font-medium mt-2">
            🎉 Bugungi maqsad bajarildi!
          </p>
        )}
      </div>

      {/* Continue Reading */}
      {readingProgress.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">📖 O&apos;qishni davom ettirish</h2>
            <Link href="/continue-reading" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
              Barchasi <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {readingProgress.map((p) => {
              const totalP = p.book.totalPages || 320;
              const pct = Math.round((p.currentPage / totalP) * 100);
              return (
                <Link
                  key={p.id}
                  href={`/reader/${p.book.slug}`}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.book.title}</p>
                    <p className="text-xs text-muted-foreground">{p.book.author?.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {p.currentPage}/{totalP} · {pct}%
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <BookOpen size={18} className="mx-auto text-primary mb-1.5" />
          <p className="text-xl font-bold text-foreground">{completedBooks}</p>
          <p className="text-[10px] text-muted-foreground">Tugatilgan</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <TrendingUp size={18} className="mx-auto text-green-600 mb-1.5" />
          <p className="text-xl font-bold text-foreground">{(pagesAgg._sum.currentPage ?? 0).toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Sahifalar</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Target size={18} className="mx-auto text-orange-600 mb-1.5" />
          <p className="text-xl font-bold text-foreground">{missionCount}</p>
          <p className="text-[10px] text-muted-foreground">Missiyalar</p>
        </div>
      </div>

      {/* Active Mission */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-orange-500" />
            <h2 className="text-sm font-semibold text-foreground">🎯 Faol missiya</h2>
          </div>
          <Link href="/missions" className="text-xs font-medium text-primary hover:underline">
            Barchasi
          </Link>
        </div>
        <div className="rounded-xl bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">Haftalik 100 sahifa challenge</p>
            <span className="text-xs font-medium text-green-600">80%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-2">
            <div className="h-full rounded-full bg-green-500" style={{ width: "80%" }} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">80 / 100 sahifa</p>
            <p className="text-xs text-orange-600 font-medium">⏰ 2 kun qoldi</p>
          </div>
        </div>
      </div>

      {/* New Books */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">🆕 Yangi kitoblar</h2>
          <Link href="/books" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
            Barchasi <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {recommendedBooks.map((book) => {
            const avgRating = book.ratings.length > 0
              ? (book.ratings.reduce((s, r) => s + r.rating, 0) / book.ratings.length).toFixed(1)
              : "—";
            return (
              <Link
                key={book.id}
                href={`/books/${book.slug}`}
                className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-all"
              >
                <div className="relative aspect-[3/4] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  ) : (
                    <BookOpen size={32} className="text-primary/30" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-foreground truncate">{book.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{book.author?.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-[10px] font-medium">{avgRating}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{book.totalPages} bet</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Trending Books */}
      {trendingBooks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">🔥 Hozir eng ko&apos;p o&apos;qilayotganlar</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {trendingBooks.map((book, i) => (
              <Link
                key={book.id}
                href={`/books/${book.slug}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-muted/30 transition-colors"
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                  i === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-500" :
                  i === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400" :
                  i === 2 ? "bg-gradient-to-br from-orange-300 to-orange-400" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{book.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{book.author?.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
