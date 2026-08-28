import { getSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { computeStreak, getPersonalStats } from "@/lib/server/reading";
import { getUserAchievements } from "@/lib/server/achievements";
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
} from "lucide-react";
import Link from "next/link";
import { ProfileLogoutButton } from "@/components/profile-logout-button";

export const dynamic = "force-dynamic";

function roleLabel(role: string): string {
  if (role === "ADMIN") return "Admin";
  if (role === "TEACHER") return "Teacher";
  return "Student";
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
      className="flex items-center justify-between px-4 py-3.5 text-sm transition-colors hover:bg-muted/50"
    >
      <span className="flex items-center gap-3 text-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </span>
      <ChevronRight size={16} className="text-muted-foreground" />
    </Link>
  );
}

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [completedCount, sessions, ratingAgg, personalStats, achievements] = await Promise.all([
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
  ]);

  const totalBooks = completedCount;
  const streak = computeStreak(sessions.map((s) => s.startedAt));
  const avgRatingRaw = ratingAgg._avg.rating ?? 0;
  const avgRating = avgRatingRaw === 0 ? 0 : Math.round(avgRatingRaw * 10) / 10;
  const booksStarted = personalStats.totalBooks;
  const pagesRead = personalStats.totalPages;
  const readingTimeHours = Math.floor(personalStats.readingTime / 60);
  const readingTimeMins = personalStats.readingTime % 60;

  return (
    <div className="max-w-md md:max-w-lg lg:max-w-xl mx-auto animate-fade-in">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Top centered */}
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

        <div className="h-px bg-border" />

        {/* Stats row 3 cols centered */}
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="flex flex-col items-center gap-1 px-2 py-4 text-center">
            <BookOpen size={18} className="text-muted-foreground" />
            <span className="text-lg font-bold text-foreground">{totalBooks}</span>
            <span className="text-xs text-muted-foreground">Books</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-2 py-4 text-center">
            <Flame size={18} className="text-orange-500" />
            <span className="text-lg font-bold text-foreground">{streak}</span>
            <span className="text-xs text-muted-foreground">Day Streak</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-2 py-4 text-center">
            <Star size={18} className="text-amber-500" />
            <span className="text-lg font-bold text-foreground">
              {avgRating === 0 ? "0" : avgRating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">Avg Rating</span>
          </div>
        </div>

        {/* Reading Statistics — Phase 4 */}
        <div className="px-4 py-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" /> Reading Statistics
          </h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <BookOpen size={16} className="mx-auto text-primary mb-1" />
              <p className="text-lg font-bold text-foreground">{booksStarted}</p>
              <p className="text-xs text-muted-foreground">Books started</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <Award size={16} className="mx-auto text-green-600 mb-1" />
              <p className="text-lg font-bold text-foreground">{totalBooks}</p>
              <p className="text-xs text-muted-foreground">Books completed</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <TrendingUp size={16} className="mx-auto text-blue-500 mb-1" />
              <p className="text-lg font-bold text-foreground">{pagesRead.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Pages read</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <Clock size={16} className="mx-auto text-orange-500 mb-1" />
              <p className="text-lg font-bold text-foreground">
                {readingTimeHours}h {readingTimeMins}m
              </p>
              <p className="text-xs text-muted-foreground">Reading time</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Achievements — Phase 4 */}
        <div className="px-4 py-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Award size={14} className="text-amber-500" /> Achievements
          </h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {achievements.map((a) => (
              <div
                key={a.id}
                className={`rounded-xl border p-3 text-center transition-all ${
                  a.unlocked
                    ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 shadow-sm"
                    : "bg-muted/30 border-border opacity-60"
                }`}
              >
                <div className="text-2xl mb-1">{a.icon}</div>
                <p className="text-xs font-semibold text-foreground line-clamp-1">{a.title}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{a.description}</p>
                <p className="mt-1 text-xs font-medium text-primary">{a.progress}</p>
                {a.unlocked && <p className="mt-1 text-[11px] font-bold text-green-600">✓ Unlocked</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Phase 1 menu items */}
        <nav className="flex flex-col divide-y divide-border/50">
          <MenuRow icon={<History size={18} />} label="Reading History" href="/history" />
          <MenuRow icon={<Settings size={18} />} label="Settings" href="/settings" />
          <ProfileLogoutButton />
        </nav>
      </div>
    </div>
  );
}
