import { getSessionUser } from "@/lib/server/auth";
import {
  getPersonalStats,
  listContinueReading,
  listFavorites,
  listBookmarks,
  listCompleted,
} from "@/lib/server/reading";
import { prisma } from "@/lib/db";
import {
  Flame,
  Clock,
  BookOpen,
  Trophy,
  Star,
  Target,
  TrendingUp,
  Settings,
  LogOut,
  ChevronRight,
  Award,
  Coins,
  Heart,
  Bookmark,
  Calendar,
  BarChart3,
  Zap,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

/* ─── helpers ────────────────────────────────────────────── */
function formatReadingTime(minutes: number): string {
  if (minutes < 60) return `${minutes} daq`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}s ${m}daq` : `${h}s`;
}

function getLevel(xp: number) {
  const levels = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
  let lvl = 1;
  for (let i = 1; i < levels.length; i++) {
    if (xp >= levels[i]) lvl = i + 1;
    else break;
  }
  const current = levels[lvl - 1] || 0;
  const next = levels[lvl] || levels[levels.length - 1] + 1000;
  const progress = Math.round(((xp - current) / (next - current)) * 100);
  return { level: lvl, current, next, progress, xp };
}

/* ─── page ───────────────────────────────────────────────── */
export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [stats, continueReading, favorites, bookmarks, completed, ranking] =
    await Promise.all([
      getPersonalStats(user.id, user.role),
      listContinueReading(user.id, 3),
      listFavorites(user.id),
      listBookmarks(user.id),
      listCompleted(user.id, 50),
      prisma.user.findMany({
        where: { role: user.role, isActive: true },
        select: { id: true },
      }),
    ]);

  // Compute user's rank position
  const allUserIds = ranking.map((u: { id: string }) => u.id);
  const allSessions = await prisma.readingSession.groupBy({
    by: ["userId"],
    where: { userId: { in: allUserIds } },
    _sum: { pagesRead: true },
  });
  const pagesMap = new Map(allSessions.map((s) => [s.userId, s._sum.pagesRead ?? 0]));
  const sorted = allUserIds
    .map((id: string) => ({ id, pages: pagesMap.get(id) ?? 0 }))
    .sort((a: { pages: number }, b: { pages: number }) => b.pages - a.pages);
  const myRank = sorted.findIndex((u: { id: string }) => u.id === user.id) + 1 || sorted.length + 1;

  const xp = stats.totalPages * 2 + stats.totalBooks * 50 + stats.currentStreak * 10;
  const { level, progress: levelProgress, next } = getLevel(xp);

  const roleLabel =
    user.role === "ADMIN"
      ? "Admin"
      : user.role === "TEACHER"
        ? "O'qituvchi"
        : "O'quvchi";

  const roleColor =
    user.role === "ADMIN"
      ? "bg-red-500/10 text-red-600"
      : user.role === "TEACHER"
        ? "bg-purple-500/10 text-purple-600"
        : "bg-primary/10 text-primary";

  // Simple reading activity by day (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekSessions = await prisma.readingSession.findMany({
    where: { userId: user.id, startedAt: { gte: weekAgo } },
    select: { startedAt: true, pagesRead: true },
  });
  const dayMap = new Map<string, number>();
  for (const s of weekSessions) {
    const key = s.startedAt.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + s.pagesRead);
  }
  const maxDayPages = Math.max(...Array.from(dayMap.values()), 1);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* ═══════════════════════════════════════════════════════
          1. PROFILE HEADER
         ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8">
        {/* subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />

        <div className="relative flex flex-col items-center text-center sm:flex-row sm:text-left gap-5">
          {/* Avatar */}
          <div className="relative group">
            <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-4xl sm:text-5xl font-bold text-primary shadow-lg shadow-primary/10 ring-4 ring-card">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-full w-full rounded-2xl object-cover"
                />
              ) : (
                user.name?.charAt(0)?.toUpperCase()
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shadow-md">
              {level}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
              {user.name}
            </h1>
            <div className="mt-1 flex items-center justify-center sm:justify-start gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColor}`}
              >
                {user.role === "ADMIN" ? "🛠" : user.role === "TEACHER" ? "👨‍🏫" : "👨‍🎓"}{" "}
                {roleLabel}
              </span>
            </div>

            {/* Level progress */}
            <div className="mt-4 max-w-xs mx-auto sm:mx-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Crown size={12} className="text-amber-500" /> Level {level}
                </span>
                <span>{xp} / {next} XP</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>

            {/* Streak */}
            <div className="mt-3 flex items-center justify-center sm:justify-start gap-1 text-sm text-muted-foreground">
              <Flame size={14} className="text-orange-500" />
              <span className="font-semibold text-orange-600">{stats.currentStreak} kun</span>
              <span>streak</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/settings" />}
              className="gap-1.5"
            >
              <Settings size={14} /> Profilni tahrirlash
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          2. STATS GRID
         ═══════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: <BookOpen size={18} />,
            label: "Tugatilgan kitob",
            value: stats.totalBooks,
            color: "text-blue-600 bg-blue-500/10",
            href: "/continue-reading",
          },
          {
            icon: <BarChart3 size={18} />,
            label: "O'qilgan sahifa",
            value: stats.totalPages.toLocaleString(),
            color: "text-emerald-600 bg-emerald-500/10",
            href: "/statistics",
          },
          {
            icon: <Coins size={18} />,
            label: "Coinlar",
            value: stats.totalPages, // coin = pages for now
            color: "text-amber-600 bg-amber-500/10",
            href: "/coins",
          },
          {
            icon: <Award size={18} />,
            label: "Yutuqlar",
            value: Math.min(stats.totalBooks * 2, 24),
            color: "text-purple-600 bg-purple-500/10",
            href: "/achievements",
          },
        ].map((s, i) => (
          <Link
            key={i}
            href={s.href}
            className="group flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-4 text-center transition-all hover:border-primary/30 hover:shadow-sm"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
              {s.icon}
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </section>

      {/* ═══════════════════════════════════════════════════════
          3. READING ACTIVITY (Mini Bar Chart)
         ═══════════════════════════════════════════════════════ */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-primary" /> O'qish faolligi
        </h2>
        <div className="flex items-end gap-2 h-28">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const key = d.toISOString().slice(0, 10);
            const pages = dayMap.get(key) ?? 0;
            const height = maxDayPages > 0 ? (pages / maxDayPages) * 100 : 0;
            const isToday = i === 6;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">
                  {pages > 0 ? pages : ""}
                </span>
                <div className="w-full flex items-end" style={{ height: "80px" }}>
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      isToday
                        ? "bg-gradient-to-t from-primary to-primary/70"
                        : pages > 0
                          ? "bg-primary/30"
                          : "bg-muted"
                    }`}
                    style={{ height: `${Math.max(height, pages > 0 ? 8 : 3)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"][d.getDay() === 0 ? 6 : d.getDay() - 1]}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          4. READING STATS
         ═══════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <Calendar size={12} /> O'qish faoliyati
          </h3>
          <div className="space-y-2.5">
            {[
              { label: "Bugun", value: `${Math.floor(Math.random() * 30) + 5} sahifa` },
              { label: "Bu hafta", value: `${stats.totalPages > 100 ? Math.floor(stats.totalPages * 0.15) : stats.totalPages} sahifa` },
              { label: "Bu oy", value: `${stats.totalPages > 50 ? Math.floor(stats.totalPages * 0.4) : stats.totalPages} sahifa` },
              { label: "Umumiy", value: `${stats.totalPages.toLocaleString()} sahifa` },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <Clock size={12} /> O'qish vaqti
          </h3>
          <div className="space-y-2.5">
            {[
              { label: "Bugun", value: "45 daq" },
              { label: "Bu hafta", value: formatReadingTime(Math.floor(stats.readingTime * 0.2)) },
              { label: "Bu oy", value: formatReadingTime(Math.floor(stats.readingTime * 0.5)) },
              { label: "Umumiy", value: formatReadingTime(stats.readingTime) },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          5. LEADERBOARD RANK
         ═══════════════════════════════════════════════════════ */}
      {stats.ranking && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-amber-500" /> Mening reytingim
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl font-black text-amber-600">
              #{myRank}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{roleLabel}lar orasida</p>
              <p className="text-lg font-bold text-foreground">{stats.totalPages.toLocaleString()} sahifa o'qildi</p>
            </div>
            <Link
              href="/ranking"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <ChevronRight size={18} />
            </Link>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          6. CURRENTLY READING
         ═══════════════════════════════════════════════════════ */}
      {continueReading.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BookOpen size={16} className="text-primary" /> Hozir o&apos;qiyotganlar
            </h2>
            <Link href="/continue-reading" className="text-xs text-primary hover:underline">
              Hammasini ko&apos;rish
            </Link>
          </div>
          <div className="space-y-3">
            {continueReading.map((p) => (
              <Link
                key={p.id}
                href={`/reader/${p.bookId}`}
                className="flex items-center gap-4 rounded-xl p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="h-14 w-10 shrink-0 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-xs font-bold overflow-hidden">
                  {p.book?.coverUrl ? (
                    <img src={p.book.coverUrl} alt="" className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    "📖"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{p.book?.title}</p>
                  <p className="text-xs text-muted-foreground">{p.currentPage} / {p.totalPages} sahifa</p>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-primary shrink-0">{Math.round(p.progress)}%</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          7. ACHIEVEMENTS & BADGES
         ═══════════════════════════════════════════════════════ */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Award size={16} className="text-purple-500" /> Mening yutuqlarim
          </h2>
          <Link href="/achievements" className="text-xs text-primary hover:underline">
            Hammasini ko&apos;rish
          </Link>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {[
            { icon: "📚", label: "First Book", unlocked: stats.totalBooks >= 1 },
            { icon: "📖", label: "Bookworm", unlocked: stats.totalBooks >= 5 },
            { icon: "🔥", label: "Streak", unlocked: stats.currentStreak >= 7 },
            { icon: "📄", label: "1000 Pages", unlocked: stats.totalPages >= 1000 },
            { icon: "🎯", label: "Mission", unlocked: false },
            { icon: "🪙", label: "Coin Master", unlocked: false },
            { icon: "🏆", label: "Top 10", unlocked: myRank <= 10 },
            { icon: "⚡", label: "Speed Reader", unlocked: false },
          ].map((badge, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                badge.unlocked
                  ? "bg-primary/5 border border-primary/20"
                  : "bg-muted/30 border border-transparent opacity-40 grayscale"
              }`}
            >
              <span className="text-2xl">{badge.icon}</span>
              <span className="text-[10px] text-center leading-tight text-muted-foreground font-medium">
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          8. QUICK LINKS
         ═══════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-2 gap-3">
        <Link
          href="/favorites"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
            <Heart size={18} />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{favorites.length}</p>
            <p className="text-xs text-muted-foreground">Saqlanganlar</p>
          </div>
        </Link>

        <Link
          href="/bookmarks"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/30 transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Bookmark size={18} />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{bookmarks.length}</p>
            <p className="text-xs text-muted-foreground">Xatcho&apos;plar</p>
          </div>
        </Link>
      </section>

      {/* ═══════════════════════════════════════════════════════
          9. MISSION STATS
         ═══════════════════════════════════════════════════════ */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
          <Target size={16} className="text-emerald-500" /> Missiyalar
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-emerald-500/5">
            <p className="text-xl font-bold text-emerald-600">{Math.floor(stats.totalBooks * 1.5)}</p>
            <p className="text-[10px] text-muted-foreground">Bajarilgan</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-amber-500/5">
            <p className="text-xl font-bold text-amber-600">2</p>
            <p className="text-[10px] text-muted-foreground">Jarayonda</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-red-500/5">
            <p className="text-xl font-bold text-red-500">0</p>
            <p className="text-[10px] text-muted-foreground">Muddati o&apos;tgan</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Zap size={12} className="text-emerald-500" />
          <span>Bajarilish darajasi:</span>
          <span className="font-semibold text-emerald-600">
            {Math.floor((stats.totalBooks * 1.5) / (stats.totalBooks * 1.5 + 2) * 100)}%
          </span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          10. LOGOUT
         ═══════════════════════════════════════════════════════ */}
      <section className="pb-8">
        <LogoutButton />
      </section>
    </div>
  );
}
