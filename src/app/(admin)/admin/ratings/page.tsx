import { requireRole } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function AdminRatingsPage() {
  const user = await requireRole("ADMIN");
  if (!user) return null;

  // Get rankings for students and teachers
  const [studentRankings, teacherRankings] = await Promise.all([
    prisma.readingProgress.groupBy({
      by: ["userId"],
      _sum: { currentPage: true },
      _count: { id: true },
      where: { user: { role: "STUDENT" } },
      orderBy: { _sum: { currentPage: "desc" } },
      take: 100,
    }),
    prisma.readingProgress.groupBy({
      by: ["userId"],
      _sum: { currentPage: true },
      _count: { id: true },
      where: { user: { role: "TEACHER" } },
      orderBy: { _sum: { currentPage: "desc" } },
      take: 100,
    }),
  ]);

  // Fetch user names
  const allUserIds = [
    ...studentRankings.map((r) => r.userId),
    ...teacherRankings.map((r) => r.userId),
  ];
  const users = await prisma.user.findMany({
    where: { id: { in: allUserIds } },
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  // Get reading time per user
  const timeAgg = await prisma.readingSession.groupBy({
    by: ["userId"],
    _sum: { duration: true },
  });
  const timeMap = new Map(timeAgg.map((t) => [t.userId, t._sum.duration ?? 0]));

  const medalColors = [
    "from-yellow-400 to-amber-500",
    "from-gray-300 to-gray-400",
    "from-orange-300 to-orange-400",
  ];

  function renderLeaderboard(entries: typeof studentRankings) {
    return (
      <div className="space-y-2 mt-4">
        {entries.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Ma&apos;lumot yo&apos;q</p>
        ) : (
          entries.map((e, i) => {
            const readingTime = timeMap.get(e.userId) ?? 0;
            return (
              <div
                key={e.userId}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:bg-muted/30"
              >
                <div className="w-8 text-center">
                  {i < 3 ? (
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${medalColors[i]}`}>
                      {i + 1}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">{i + 1}</span>
                  )}
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {(userMap.get(e.userId) ?? "?").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{userMap.get(e.userId) ?? "Noma'lum"}</p>
                  <p className="text-xs text-muted-foreground">{e._count.id} ta kitob</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{(e._sum.currentPage ?? 0).toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground">{Math.round(readingTime / 60)}h</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reytinglar</h1>
        <p className="text-sm text-muted-foreground mt-1">Platformadagi o&apos;qish reytingi</p>
      </div>

      <Tabs defaultValue="students">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="students" className="flex-1 sm:flex-none">O&apos;quvchilar</TabsTrigger>
          <TabsTrigger value="teachers" className="flex-1 sm:flex-none">O&apos;qituvchilar</TabsTrigger>
        </TabsList>
        <TabsContent value="students">
          {renderLeaderboard(studentRankings)}
        </TabsContent>
        <TabsContent value="teachers">
          {renderLeaderboard(teacherRankings)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
