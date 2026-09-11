import { prisma } from "@/lib/db";
import {
  Flame,
  Snowflake,
  Tags,
  Languages,
  Clock,
  BookOpen,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ManagerAnalyticsPage() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    topAgg,
    leastAgg,
    langAgg,
    avgAgg,
    weekSessions,
    monthSessions,
    totalSessions,
    topStudentsAgg,
  ] = await Promise.all([
    // Top 10 o'qilgan kitoblar
    prisma.readingSession.groupBy({
      by: ["bookId"],
      _count: { bookId: true },
      _sum: { pagesRead: true },
      orderBy: { _count: { bookId: "desc" } },
      take: 10,
    }),
    // Top 10 kam o'qilgan faol kitoblar
    prisma.book.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        title: true,
        author: { select: { name: true } },
        _count: { select: { sessions: true } },
      },
      orderBy: { sessions: { _count: "asc" } },
      take: 10,
    }),
    prisma.book.groupBy({ by: ["language"], _count: { _all: true } }),
    prisma.readingSession.aggregate({ _avg: { duration: true, pagesRead: true } }),
    prisma.readingSession.count({ where: { startedAt: { gte: weekAgo } } }),
    prisma.readingSession.count({ where: { startedAt: { gte: monthStart } } }),
    prisma.readingSession.count(),
    // Eng faol o'quvchilar (o'qigan betlar bo'yicha)
    prisma.readingSession.groupBy({
      by: ["userId"],
      _sum: { pagesRead: true },
      orderBy: { _sum: { pagesRead: "desc" } },
      take: 5,
    }),
  ]);

  const [topBooks, topUsers] = await Promise.all([
    topAgg.length
      ? prisma.book.findMany({
          where: { id: { in: topAgg.map((r) => r.bookId) } },
          select: { id: true, title: true, author: { select: { name: true } } },
        })
      : [],
    topStudentsAgg.length
      ? prisma.user.findMany({
          where: { id: { in: topStudentsAgg.map((r) => r.userId) } },
          select: { id: true, name: true, group: true },
        })
      : [],
  ]);
  const bookMap = new Map(topBooks.map((b) => [b.id, b]));
  const userMap = new Map(topUsers.map((u) => [u.id, u]));

  const topCategories = await prisma.category.findMany({
    include: { _count: { select: { books: true } } },
    orderBy: { books: { _count: "desc" } },
    take: 6,
  });

  const langLabels: Record<string, string> = {
    UZ: "O'zbek",
    RU: "Rus",
    EN: "Ingliz",
  };
  const langTotal = langAgg.reduce((sum, l) => sum + l._count._all, 0);

  const maxTop = Math.max(1, ...topAgg.map((r) => r._count.bookId));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kitob analitikasi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Qaysi kitoblar o&apos;qilyapti, qaysilari talab qilinmoqda — to&apos;liq ko&apos;rinish
        </p>
      </div>

      {/* ─── Umumiy ko'rsatkichlar ─── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60 text-primary">
              <BookOpen size={16} />
            </span>
            <p className="text-xs font-medium text-muted-foreground">Jami o&apos;qish sessiyalari</p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {totalSessions.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60 text-green-600">
              <Flame size={16} />
            </span>
            <p className="text-xs font-medium text-muted-foreground">Bu hafta</p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {weekSessions.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60 text-blue-600">
              <Clock size={16} />
            </span>
            <p className="text-xs font-medium text-muted-foreground">Bu oy</p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {monthSessions.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60 text-violet-600">
              <Clock size={16} />
            </span>
            <p className="text-xs font-medium text-muted-foreground">O&apos;rtacha sessiya</p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {Math.round((avgAgg._avg.duration ?? 0) / 60)} daq
          </p>
        </div>
      </div>

      {/* ─── Top kitoblar ranking ─── */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <Flame size={16} className="text-orange-500" />
          Top 10 o&apos;qilgan kitoblar
        </h2>
        {topAgg.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            📚 Hozircha o&apos;qish statistikasi yo&apos;q
          </p>
        ) : (
          <ol className="space-y-2.5">
            {topAgg.map((r, i) => {
              const b = bookMap.get(r.bookId);
              const pct = Math.round((r._count.bookId / maxTop) * 100);
              return (
                <li key={r.bookId} className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{b?.title ?? "—"}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {b?.author?.name ?? "—"} · {(r._sum.pagesRead ?? 0).toLocaleString()} bet
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                      {r._count.bookId} o&apos;qish
                    </span>
                  </div>
                  <div className="ml-10 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── Kam o'qilgan kitoblar ─── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Snowflake size={16} className="text-blue-500" />
            E&apos;tibor talab qiladigan kitoblar
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Faol holatdagi eng kam o&apos;qilgan kitoblar — mashhurlikni oshirish uchun ko&apos;brib qayta ishlash kerak bo&apos;lishi mumkin
          </p>
          {leastAgg.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Hozircha faol kitoblar yo&apos;q
            </p>
          ) : (
            <ol className="space-y-2.5">
              {leastAgg.map((b, i) => (
                <li key={b.id} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{b.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {b.author?.name ?? "—"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                    {b._count.sessions} o&apos;qish
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* ─── Til bo'yicha taqsimot ─── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Languages size={16} className="text-primary" />
            Til bo&apos;yicha taqsimot
          </h2>
          {langTotal === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Hozircha kitoblar yo&apos;q
            </p>
          ) : (
            <div className="space-y-3">
              {langAgg.map((l) => {
                const pct = Math.round((l._count._all / langTotal) * 100);
                return (
                  <div key={l.language}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{langLabels[l.language] ?? l.language}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {l._count._all} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Mashhur kategoriyalar ─── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Tags size={16} className="text-primary" />
            Mashhur kategoriyalar
          </h2>
          {topCategories.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Hozircha kategoriyalar yo&apos;q
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {topCategories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-border px-3 py-2"
                >
                  <span className="truncate text-sm font-medium">{c.name}</span>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                    {c._count.books}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Eng faol o'quvchilar ─── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Users size={16} className="text-primary" />
            Eng faol o&apos;quvchilar
          </h2>
          {topStudentsAgg.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Hali faollik statistikasi yo&apos;q
            </p>
          ) : (
            <ol className="space-y-2.5">
              {topStudentsAgg.map((r, i) => {
                const u = userMap.get(r.userId);
                return (
                  <li key={r.userId} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u?.name ?? "—"}</p>
                      <p className="truncate text-xs text-muted-foreground">{u?.group ?? "—"}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                      {(r._sum.pagesRead ?? 0).toLocaleString()} bet
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
