import { prisma } from "@/lib/db";

export type Insight = {
  icon: string;
  title: string;
  description: string;
  trend?: string;
};

export async function getSmartInsights(): Promise<Insight[]> {
  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 86400000);
  const prev30 = new Date(now.getTime() - 60 * 86400000);

  const [lastMonthSessions, prevMonthSessions, topCats, topBooks] = await Promise.all([
    prisma.readingSession.findMany({ where: { startedAt: { gte: last30 } }, include: { book: { include: { category: true } } } }),
    prisma.readingSession.findMany({ where: { startedAt: { gte: prev30, lt: last30 } }, include: { book: { include: { category: true } } } }),
    prisma.category.findMany({ include: { _count: { select: { books: true } }, books: { select: { id: true } } }, take: 10 }),
    prisma.readingProgress.groupBy({ by: ["bookId"], _count: { bookId: true }, orderBy: { _count: { bookId: "desc" } }, take: 3 }),
  ]);

  const insights: Insight[] = [];

  // Category trend
  const catCountLast: Record<string, number> = {};
  const catCountPrev: Record<string, number> = {};
  for (const s of lastMonthSessions) {
    const cat = (s.book as any)?.category?.name ?? "Unknown";
    catCountLast[cat] = (catCountLast[cat] || 0) + 1;
  }
  for (const s of prevMonthSessions) {
    const cat = (s.book as any)?.category?.name ?? "Unknown";
    catCountPrev[cat] = (catCountPrev[cat] || 0) + 1;
  }
  const sortedCats = Object.entries(catCountLast).sort((a, b) => b[1] - a[1]);
  if (sortedCats[0]) {
    const [cat, count] = sortedCats[0];
    const prev = catCountPrev[cat] || 1;
    const pct = Math.round(((count - prev) / prev) * 100);
    if (pct > 0) {
      insights.push({
        icon: "💡",
        title: "Library Insight",
        description: `So'nggi oyda ${cat} kategoriyasidagi kitoblarning o'qilishi ${pct}% oshdi.`,
        trend: `+${pct}%`,
      });
    }
  }

  // Most read books insight
  if (topBooks.length > 0) {
    const bookIds = topBooks.map((b) => b.bookId);
    const books = await prisma.book.findMany({ where: { id: { in: bookIds } }, select: { id: true, title: true } });
    const map = new Map(books.map((b) => [b.id, b.title]));
    const top = topBooks[0];
    insights.push({
      icon: "📚",
      title: "Eng mashhur kitob",
      description: `"${map.get(top.bookId) ?? top.bookId}" — ${top._count.bookId} marta o'qilgan.`,
    });
  }

  // Activity change
  const lastCount = lastMonthSessions.length;
  const prevCount = prevMonthSessions.length || 1;
  const activityPct = Math.round(((lastCount - prevCount) / prevCount) * 100);
  insights.push({
    icon: activityPct >= 0 ? "📈" : "📉",
    title: "Faollik o'zgarishi",
    description: `O'qish faolligi ${activityPct >= 0 ? "+" : ""}${activityPct}% o'zgardi (so'nggi 30 kun: ${lastCount} sessiya)`,
    trend: `${activityPct >= 0 ? "+" : ""}${activityPct}%`,
  });

  // Reading trends by time
  const avgDuration =
    lastMonthSessions.length > 0
      ? Math.round(lastMonthSessions.reduce((s, x) => s + x.duration, 0) / lastMonthSessions.length / 60)
      : 0;
  insights.push({
    icon: "⏱️",
    title: "O'rtacha o'qish vaqti",
    description: `O'quvchilar o'rtacha ${avgDuration} daqiqa o'qimoqda.`,
  });

  return insights.slice(0, 4);
}

export async function answerAdminQuery(query: string): Promise<string> {
  const q = query.toLowerCase();

  if (q.includes("eng ko'p") && q.includes("kitob")) {
    const top = await prisma.readingProgress.groupBy({
      by: ["bookId"],
      _count: { bookId: true },
      orderBy: { _count: { bookId: "desc" } },
      take: 5,
    });
    const books = await prisma.book.findMany({ where: { id: { in: top.map((t) => t.bookId) } }, select: { title: true, id: true } });
    const map = new Map(books.map((b) => [b.id, b.title]));
    const list = top.map((t, i) => `${i + 1}. ${map.get(t.bookId) ?? t.bookId} — ${t._count.bookId} marta`).join("\n");
    return `📚 Eng ko'p o'qilgan 5 ta kitob:\n${list}`;
  }

  if (q.includes("kategoriya") && (q.includes("mashhur") || q.includes("ko'p"))) {
    const cats = await prisma.category.findMany({
      include: { _count: { select: { books: true } } },
      orderBy: { books: { _count: "desc" } },
      take: 5,
    });
    const mostRead = await prisma.readingSession.findMany({ include: { book: { include: { category: true } } }, take: 100 });
    const count: Record<string, number> = {};
    for (const s of mostRead) {
      const cat = (s.book as any)?.category?.name ?? "Noma'lum";
      count[cat] = (count[cat] || 0) + 1;
    }
    const sorted = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return `🗂️ Eng mashhur kategoriyalar (o'qilish bo'yicha):\n${sorted.map((c, i) => `${i + 1}. ${c[0]} — ${c[1]} sessiya`).join("\n")}`;
  }

  if (q.includes("faol") || q.includes("active")) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const active = await prisma.readingSession.findMany({
      where: { startedAt: { gte: today } },
      select: { userId: true },
      distinct: ["userId"],
    });
    const total = await prisma.user.count({ where: { role: "STUDENT", isActive: true } });
    return `👥 Bugun faol o'quvchilar: ${active.length} / ${total} ta.`;
  }

  if (q.includes("reyting") || q.includes("rating")) {
    const agg = await prisma.rating.aggregate({ _avg: { rating: true }, _count: { _all: true } });
    return `⭐ O'rtacha reyting: ${(agg._avg.rating ?? 0).toFixed(1)} / 5 (${agg._count._all} ta baho)`;
  }

  if (q.includes("tugatilgan") || q.includes("completed")) {
    const c = await prisma.readingProgress.count({ where: { completedAt: { not: null } } });
    return `✅ Jami tugatilgan kitoblar: ${c} ta`;
  }

  return `🤖 Savolingizni tushunmadim. Masalan: "Bu oy eng ko'p o'qilgan 5 ta kitob qaysilar?", "Qaysi kategoriya eng mashhur?", "Bugun nechta faol o'quvchi bor?" deb so'rang.`;
}
