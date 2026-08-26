import { getSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { computeStreak } from "@/lib/server/reading";
import {
  User,
  BookOpen,
  Flame,
  Star,
  ChevronRight,
  History,
  Settings,
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

  const [completedCount, sessions, ratingAgg] = await Promise.all([
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
  ]);

  const totalBooks = completedCount;
  const streak = computeStreak(sessions.map((s) => s.startedAt));
  const avgRatingRaw = ratingAgg._avg.rating ?? 0;
  const avgRating = avgRatingRaw === 0 ? 0 : Math.round(avgRatingRaw * 10) / 10;

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
