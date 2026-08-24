import { getSessionUser } from "@/lib/server/auth";
import { getPersonalStats } from "@/lib/server/reading";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { Flame, Clock, BookOpen, Trophy, CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) return null;
  const stats = await getPersonalStats(user.id, user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
          {user.name?.charAt(0)}
        </span>
        <div>
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          <p className="text-sm text-muted-foreground">
            {user.role === "ADMIN" ? "Admin" : user.role === "TEACHER" ? "O'qituvchi" : "O'quvchi"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="O'qilgan sahifa" value={stats.totalPages.toLocaleString()} icon={<BookOpen className="size-5" />} />
        <Stat label="O'qilgan kitob" value={stats.totalBooks.toLocaleString()} icon={<CalendarDays className="size-5" />} />
        <Stat label="O'qish vaqti" value={`${stats.readingTime} daq`} icon={<Clock className="size-5" />} />
        <Stat label="Streak" value={`${stats.currentStreak} kun`} icon={<Flame className="size-5" />} />
      </div>

      <Card className="flex items-center gap-3 p-4">
        <Trophy className="size-5 text-primary" />
        <div>
          <p className="font-medium">Umumiy reyting</p>
          <p className="text-sm text-muted-foreground">
            {stats.ranking ? `#${stats.ranking} o'rin` : "Hali reyting yo'q"}
          </p>
        </div>
      </Card>
    </div>
  );
}
