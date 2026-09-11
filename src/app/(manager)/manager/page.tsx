import { prisma } from "@/lib/db";
import Link from "next/link";
import {
  BookMarked,
  BookOpen,
  EyeOff,
  FileEdit,
  Tags,
  BookPlus,
  TrendingUp,
  Flame,
  Snowflake,
  Languages,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ManagerDashboard() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  const [
    totalBooks,
    activeBooks,
    hiddenBooks,
    draftBooks,
    categoriesCount,
    newThisWeek,
    topAgg,
    bottomAgg,
    langAgg,
    sessionsAgg,
  ] = await Promise.all([
    prisma.book.count(),
    prisma.book.count({ where: { status: "ACTIVE", isPublished: true } }),
    prisma.book.count({ where: { status: "HIDDEN" } }),
    prisma.book.count({
      where: { OR: [{ status: "DRAFT" }, { isPublished: false }] },
    }),
    prisma.category.count(),
    prisma.book.count({ where: { createdAt: { gte: weekAgo } } }),
    // Eng ko'p o'qilgan kitoblar (top 5)
    prisma.readingSession.groupBy({
      by: ["bookId"],
      _count: { bookId: true },
      orderBy: { _count: { bookId: "desc" } },
      take: 5,
    }),
    // Eng kam o'qilgan kitoblar (past 5, faqat faollar)
    prisma.book.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        title: true,
        author: { select: { name: true } },
        _count: { select: { sessions: true } },
      },
      orderBy: { sessions: { _count: "asc" } },
      take: 5,
    }),
    // Til bo'yicha taqsimot
    prisma.book.groupBy({ by: ["language"], _count: { _all: true } }),
    // O'rtacha sessiya davomiyligi
    prisma.readingSession.aggregate({ _avg: { duration: true, pagesRead: true } }),
  ]);

  const topBookIds = topAgg.map((r) => r.bookId);
  const topBooks = topBookIds.length
    ? await prisma.book.findMany({
        where: { id: { in: topBookIds } },
        select: {
          id: true,
          title: true,
          author: { select: { name: true } },
        },
      })
    : [];
  const bookMap = new Map(topBooks.map((b) => [b.id, b]));

  // Eng mashhur kategoriyalar (top 5)
  const topCategories = await prisma.category.findMany({
    include: { _count: { select: { books: true } } },
    orderBy: { books: { _count: "desc" } },
    take: 5,
  });

  const stats = [
    {
      label: "Jami kitoblar",
      value: totalBooks,
      sub: `+${newThisWeek} shu hafta`,
      icon: BookMarked,
      color: "text-primary",
    },
    {
      label: "Faol kitoblar",
      value: activeBooks,
      sub: "o'quvchilar ko'radi",
      icon: BookOpen,
      color: "text-green-600",
    },
    {
      label: "Yashirilgan",
      value: hiddenBooks,
      sub: "o'quvchilarga ko'rinmaydi",
      icon: EyeOff,
      color: "text-orange-500",
    },
    {
      label: "Qoralama",
      value: draftBooks,
      sub: "hali tayyor emas",
      icon: FileEdit,
      color: "text-amber-600",
    },
    {
      label: "Kategoriyalar",
      value: categoriesCount,
      sub: "kitob toifalari",
      icon: Tags,
      color: "text-violet-600",
    },
    {
      label: "Yangi kitoblar",
      value: newThisWeek,
      sub: "shu hafta qo'shildi",
      icon: BookPlus,
      color: "text-blue-600",
    },
  ];

  const langLabels: Record<string, string> = {
    UZ: "O'zbek",
    RU: "Rus",
    EN: "Ingliz",
  };
  const langTotal = langAgg.reduce((sum, l) => sum + l._count._all, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kitoblar paneli</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kutubxona fondining holati — bir qarashda
        </p>
      </div>

      {/* ─── KPI kartalar ─── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground leading-snug">
                  {s.label}
                </p>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/60 ${s.color}`}
                >
                  <Icon size={16} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {s.value.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{s.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── Eng ko'p o'qilgan kitoblar ─── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Flame size={16} className="text-orange-500" />
              Eng ko&apos;p o&apos;qilgan kitoblar
            </h2>
            <Link
              href="/manager/analytics"
              className="text-xs font-medium text-primary hover:underline"
            >
              Batafsil
            </Link>
          </div>
          {topAgg.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              📚 Hozircha o&apos;qish statistikasi yo&apos;q
            </p>
          ) : (
            <ol className="space-y-2.5">
              {topAgg.map((r, i) => {
                const b = bookMap.get(r.bookId);
                return (
                  <li key={r.bookId} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{b?.title ?? "—"}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {b?.author?.name ?? "—"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                      {r._count.bookId} o&apos;qish
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* ─── Eng kam o'qilgan kitoblar ─── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Snowflake size={16} className="text-blue-500" />
              Eng kam o&apos;qilgan kitoblar
            </h2>
          </div>
          {bottomAgg.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Hozircha faol kitoblar yo&apos;q
            </p>
          ) : (
            <ol className="space-y-2.5">
              {bottomAgg.map((b, i) => (
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── Eng mashhur kategoriyalar ─── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Tags size={16} className="text-primary" />
              Eng mashhur kategoriyalar
            </h2>
            <Link
              href="/manager/categories"
              className="text-xs font-medium text-primary hover:underline"
            >
              Boshqarish
            </Link>
          </div>
          {topCategories.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Hozircha kategoriyalar yo&apos;q
            </p>
          ) : (
            <ol className="space-y-2.5">
              {topCategories.map((c, i) => (
                <li key={c.id} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">{c.name}</p>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                    {c._count.books} kitob
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* ─── Til bo'yicha statistika + o'rtacha faollik ─── */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
              <Languages size={16} className="text-primary" />
              Til bo&apos;yicha statistika
            </h2>
            {langTotal === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Hozircha kitoblar yo&apos;q
              </p>
            ) : (
              <div className="space-y-3">
                {langAgg.map((l) => {
                  const pct = Math.round((l._count._all / langTotal) * 100);
                  return (
                    <div key={l.language}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {langLabels[l.language] ?? l.language}
                        </span>
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

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
              <TrendingUp size={16} className="text-primary" />
              O&apos;rtacha faollik
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen size={15} /> Sessiyaga sahifa
                </div>
                <span className="text-lg font-bold tabular-nums">
                  {Math.round(sessionsAgg._avg.pagesRead ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp size={15} /> Sessiya davomiyligi
                </div>
                <span className="text-lg font-bold tabular-nums">
                  {Math.round((sessionsAgg._avg.duration ?? 0) / 60)} daq
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
