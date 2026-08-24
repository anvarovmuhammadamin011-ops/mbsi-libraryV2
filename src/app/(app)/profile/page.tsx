import { getSessionUser } from "@/lib/server/auth";
import { getPersonalStats } from "@/lib/server/reading";
import { Stat } from "@/components/ui/stat";
import { Flame, Clock, BookOpen, Trophy, CalendarDays, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) return null;
  const stats = await getPersonalStats(user.id, user.role);

  const roleLabel =
    user.role === "ADMIN"
      ? "Admin"
      : user.role === "TEACHER"
        ? "O'qituvchi"
        : "O'quvchi";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Profile header */}
      <section className="flex flex-col items-center text-center sm:flex-row sm:text-left gap-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-3xl font-bold text-primary">
          {user.name?.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{roleLabel}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
            <Button variant="outline" size="sm" render={<Link href="/settings" />} className="gap-1.5">
              <Settings size={14} /> Sozlamalar
            </Button>
          </div>
        </div>
      </section>

      {/* Stats grid */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="O'qilgan sahifa" value={stats.totalPages.toLocaleString()} icon={<BookOpen className="size-5" />} />
        <Stat label="Tugatilgan kitob" value={stats.totalBooks.toLocaleString()} icon={<CalendarDays className="size-5" />} />
        <Stat label="O'qish vaqti" value={`${stats.readingTime} daq`} icon={<Clock className="size-5" />} />
        <Stat label="Streak" value={`${stats.currentStreak} kun`} icon={<Flame className="size-5" />} />
      </section>

      {/* Ranking */}
      {stats.ranking && (
        <section className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Trophy className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Umumiy reyting</p>
            <p className="text-lg font-bold text-primary">#{stats.ranking} o'rin</p>
          </div>
        </section>
      )}
    </div>
  );
}
