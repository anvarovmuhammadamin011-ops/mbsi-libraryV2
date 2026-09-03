import { getSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { computeStreak, getPersonalStats } from "@/lib/server/reading";
import { getUserAchievements } from "@/lib/server/achievements";
import { ReadingJourneyCard } from "@/components/reading-journey-card";
import { BallDisplay } from "@/components/ball-display";
import {
  User,
  BookOpen,
  Flame,
  Star,
  ChevronRight,
  History,
  Settings,
  Clock,
  Award,
  TrendingUp,
  Target,
} from "lucide-react";
import Link from "next/link";
import { ProfileLogoutButton } from "@/components/profile-logout-button";

export const dynamic = "force-dynamic";

function roleLabel(role: string): string {
  if (role === "ADMIN") return "Admin";
  if (role === "TEACHER") return "O'qituvchi";
  return "O'quvchi";
}

function MenuRow({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-5 py-4 text-sm transition-colors hover:bg-muted/50"
    >
      <span className="flex items-center gap-4 text-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </span>
      <ChevronRight size={18} className="text-muted-foreground" />
    </Link>
  );
}

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [completedCount, sessions, ratingAgg, personalStats, achievements, monthSessions] = await Promise.all([
    prisma.readingProgress.count({
      where: { userId: user.id, completedAt: { not: null } },
    }),
    prisma.readingSession.findMany({
      where: { userId: user.id },
      select: { startedAt: true },
    }),
    prisma.rating.aggregate({
      where: { userId: user.id },
      _avg: { rating: true },
    }),
    getPersonalStats(user.id, user.role),
    getUserAchievements(user.id),
    prisma.readingSession.findMany({
      where: {
        userId: user.id,
        startedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      select: { duration: true },
    }),
  ]);

  const totalBooks = completedCount;
  const streak = computeStreak(sessions.map((s) => s.startedAt));
  const avgRatingRaw = ratingAgg._avg.rating ?? 0;
  const avgRating = avgRatingRaw === 0 ? 0 : Math.round(avgRatingRaw * 10) / 10;
  const booksStarted = personalStats.totalBooks;
  const pagesRead = personalStats.totalPages;
  const readingTimeHours = Math.floor(personalStats.readingTime / 60);
  const readingTimeMins = personalStats.readingTime % 60;
  const monthSeconds = monthSessions.reduce((sum, s) => sum + (s.duration ?? 0), 0);
  const monthHours = Math.floor(monthSeconds / 3600);
  const monthMinutes = Math.floor((monthSeconds % 3600) / 60);

  return (
    <div className="max-w-md md:max-w-lg lg:max-w-xl mx-auto animate-fade-in space-y-4 pb-20 md:pb-0">
      {/* Hero Card */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col items-center px-6 py-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.name}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <User size={32} />
            )}
          </div>
          <h1 className="mt-4 text-lg font-bold text-foreground">{user.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{roleLabel(user.role)}</p>
        </div>

        {/* Stats row 3 cols centered */}
        <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
          <div className="flex flex-col items-center gap-1 px-2 py-4 text-center">
            <BookOpen size={18} className="text-muted-foreground" />
            <span className="text-lg font-bold text-foreground">{totalBooks}</span>
            <span className="text-xs text-muted-foreground">Kitoblar</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-2 py-4 text-center">
            <Flame size={18} className="text-orange-500" />
            <span className="text-lg font-bold text-foreground">{streak}</span>
            <span className="text-xs text-muted-foreground">Kunlik streak</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-2 py-4 text-center">
            <Star size={18} className="text-amber-500" />
            <span className="text-lg font-bold text-foreground">
              {avgRating === 0 ? "0" : avgRating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">O'rtacha reyting</span>
          </div>
        </div>
      </div>

      {/* Ball Display */}
      <div className="rounded-2xl border border-border bg-card shadow-sm px-4 py-4 flex justify-center">
        <BallDisplay initialBalls={(user as any).balls ?? 0} />
      </div>

      {/* Reading Journey */}
      <ReadingJourneyCard booksCompleted={totalBooks} streak={streak} monthHours={monthHours} monthMinutes={monthMinutes} />

      {/* Achievements */}
      <div className="rounded-2xl border border-border bg-card shadow-sm px-4 py-4">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Award size={14} className="text-amber-500" /> Yutuqlar
        </h2>
        {achievements.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
            {achievements.map((a) => (
              <div
                key={a.id}
                className={`snap-start shrink-0 w-36 rounded-xl border p-3 text-center transition-all ${
                  a.unlocked
                    ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 shadow-sm"
                    : "bg-muted/30 border-border opacity-60"
                }`}
              >
                <div className="text-2xl mb-1" role="img" aria-label={a.title}>{a.icon}</div>
                <p className="text-xs font-semibold text-foreground line-clamp-1">{a.title}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{a.description}</p>
                <p className="mt-1 text-xs font-medium text-primary">{a.progress}</p>
                {a.unlocked && <p className="mt-1 text-[11px] font-bold text-green-600">✓ Ochildi</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Award size={32} className="text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Hali yutuqlar yo'q</p>
            <p className="text-xs text-muted-foreground mt-1">Kitoblar o'qish orqali yutuqlar qo'lga kiriting!</p>
          </div>
        )}
      </div>

      {/* Reading Statistics */}
      <div className="rounded-2xl border border-border bg-card shadow-sm px-4 py-4">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp size={14} className="text-primary" /> O'qish statistikasi
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <BookOpen size={16} className="mx-auto text-primary mb-1" />
            <p className="text-lg font-bold text-foreground">{booksStarted}</p>
            <p className="text-xs text-muted-foreground">Boshlangan kitoblar</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <Award size={16} className="mx-auto text-green-600 mb-1" />
            <p className="text-lg font-bold text-foreground">{totalBooks}</p>
            <p className="text-xs text-muted-foreground">Tugatilgan kitoblar</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <TrendingUp size={16} className="mx-auto text-blue-500 mb-1" />
            <p className="text-lg font-bold text-foreground">{pagesRead.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">O'qilgan sahifalar</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <Clock size={16} className="mx-auto text-orange-500 mb-1" />
            <p className="text-lg font-bold text-foreground">
              {readingTimeHours}h {readingTimeMins}m
            </p>
            <p className="text-xs text-muted-foreground">O'qish vaqti</p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <nav className="rounded-2xl border border-border bg-card shadow-sm flex flex-col divide-y divide-border/50 overflow-hidden">
        <MenuRow icon={<Target size={20} />} label="Shaxsiy reja" href="/plan" />
        <MenuRow icon={<History size={20} />} label="O'qish tarixi" href="/history" />
        <MenuRow icon={<Settings size={20} />} label="Sozlamalar" href="/settings" />
        <ProfileLogoutButton />
      </nav>
    </div>
  );
}
