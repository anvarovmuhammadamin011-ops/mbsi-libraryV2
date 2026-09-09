import { prisma } from "@/lib/db";

// ============================================================
// MBSI Library — Admin Diagnostics & Analytics
// ============================================================
// All metrics are computed from reading_sessions, reading_progress,
// users, books, categories, favorites and search_logs.
// Aggregation happens in Postgres (groupBy / aggregate) to keep
// payload sizes small even with thousands of sessions.
// ============================================================

// ─── Search logging (zero-result diagnostics) ───────────────

export async function logSearch(input: {
  userId?: string;
  query: string;
  resultCount: number;
}) {
  await prisma.searchLog.create({
    data: {
      userId: input.userId ?? null,
      query: input.query.trim().slice(0, 300),
      resultCount: input.resultCount,
    },
  });
}

export type ZeroResultSearch = { query: string; count: number };

async function getZeroResultSearches(): Promise<ZeroResultSearch[]> {
  const grouped = await prisma.searchLog.groupBy({
    by: ["query"],
    where: { resultCount: 0 },
    _count: { query: true },
    orderBy: { _count: { query: "desc" } },
    take: 10,
  });
  return grouped.map((g) => ({ query: g.query, count: g._count.query }));
}

// ─── A. Reading analytics ────────────────────────────────────

export type CompletionStats = {
  totalStarted: number;
  totalCompleted: number;
  completionRate: number; // 0-100
  abandoned: number; // started but < 30% progress
  inProgress: number;
};

async function getCompletionStats(): Promise<CompletionStats> {
  const [total, completed, abandoned] = await Promise.all([
    prisma.readingProgress.count(),
    prisma.readingProgress.count({ where: { completedAt: { not: null } } }),
    prisma.readingProgress.count({ where: { progress: { lt: 30 }, completedAt: null } }),
  ]);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  return {
    totalStarted: total,
    totalCompleted: completed,
    completionRate,
    abandoned,
    inProgress: Math.max(0, total - completed - abandoned),
  };
}

export type FunnelStep = { label: string; value: number };

async function getReadingFunnel(): Promise<FunnelStep[]> {
  const [pageViews, started, half, finished] = await Promise.all([
    // Proxy for page views: all progress records (user opened the book page)
    prisma.readingProgress.count(),
    // Started reading: at least 1 page read
    prisma.readingProgress.count({ where: { currentPage: { gt: 0 } } }),
    // Reached >= 50%
    prisma.readingProgress.count({ where: { progress: { gte: 50 } } }),
    // Fully completed
    prisma.readingProgress.count({ where: { completedAt: { not: null } } }),
  ]);
  return [
    { label: "Sahifaga tashrif", value: pageViews },
    { label: "Boshlash", value: started },
    { label: "50% o'qish", value: half },
    { label: "Tugatish", value: finished },
  ];
}

export type SessionPoint = { durationMin: number; pages: number };

async function getSessionScatter(take = 400): Promise<SessionPoint[]> {
  const sessions = await prisma.readingSession.findMany({
    where: { pagesRead: { gt: 0 } },
    select: { duration: true, pagesRead: true },
    orderBy: { startedAt: "desc" },
    take,
  });
  return sessions.map((s) => ({
    durationMin: Math.max(1, Math.round(s.duration / 60)),
    pages: s.pagesRead,
  }));
}

// ─── B. Category insights ────────────────────────────────────

export type CategoryBalance = {
  name: string;
  books: number;
  reads: number;
  saves: number;
  demandRatio: number; // reads per book
};

async function getCategoryBalance(): Promise<CategoryBalance[]> {
  const categories = await prisma.category.findMany({
    select: {
      name: true,
      _count: { select: { books: true } },
      books: { select: { id: true } },
    },
  });

  const bookCat = new Map<string, string>();
  for (const c of categories) {
    for (const b of c.books) bookCat.set(b.id, c.name);
  }

  // Reads per category (progress records)
  const readsGroup = await prisma.readingProgress.groupBy({
    by: ["bookId"],
    _count: { bookId: true },
  });
  const readsByCat: Record<string, number> = {};
  for (const r of readsGroup) {
    const cat = bookCat.get(r.bookId);
    if (cat) readsByCat[cat] = (readsByCat[cat] ?? 0) + r._count.bookId;
  }

  // Saves (favorites) per category
  const favs = await prisma.favorite.findMany({ select: { bookId: true } });
  const savesByCat: Record<string, number> = {};
  for (const f of favs) {
    const cat = bookCat.get(f.bookId);
    if (cat) savesByCat[cat] = (savesByCat[cat] ?? 0) + 1;
  }

  return categories
    .map((c) => {
      const reads = readsByCat[c.name] ?? 0;
      const saves = savesByCat[c.name] ?? 0;
      return {
        name: c.name,
        books: c._count.books,
        reads,
        saves,
        demandRatio: c._count.books > 0 ? Math.round((reads / c._count.books) * 10) / 10 : 0,
      };
    })
    .sort((a, b) => b.reads - a.reads)
    .slice(0, 8);
}

export type CategoryTrendPoint = { month: string; [category: string]: string | number };

async function getCategoryTrends(): Promise<CategoryTrendPoint[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - 6);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const sessions = await prisma.readingSession.findMany({
    where: { startedAt: { gte: since } },
    select: { startedAt: true, book: { select: { category: { select: { name: true } } } } },
  });

  const months: string[] = [];
  const cursor = new Date(since);
  for (let i = 0; i < 7; i++) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Top 4 categories overall
  const totals: Record<string, number> = {};
  for (const s of sessions) {
    const cat = s.book?.category?.name ?? "Noma'lum";
    totals[cat] = (totals[cat] ?? 0) + 1;
  }
  const topCats = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([c]) => c);

  const rows: CategoryTrendPoint[] = months.map((m) => ({ month: m }));
  for (const s of sessions) {
    const cat = s.book?.category?.name ?? "Noma'lum";
    if (!topCats.includes(cat)) continue;
    const m = `${s.startedAt.getFullYear()}-${String(s.startedAt.getMonth() + 1).padStart(2, "0")}`;
    const row = rows.find((r) => r.month === m);
    if (row) row[cat] = ((row[cat] as number) ?? 0) + 1;
  }
  for (const row of rows) {
    for (const c of topCats) if (row[c] === undefined) row[c] = 0;
  }
  void totals;
  return rows;
}

// ─── C. User engagement ──────────────────────────────────────

export type SegmentStat = { name: string; value: number };

async function getUserSegments(): Promise<SegmentStat[]> {
  const users = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    select: {
      id: true,
      createdAt: true,
      sessions: { select: { startedAt: true }, orderBy: { startedAt: "desc" }, take: 1 },
      _count: { select: { sessions: true } },
    },
  });

  const now = Date.now();
  const DAY = 86400000;
  let neu = 0; // registered < 7d ago
  let active = 0; // session in last 7d
  let passive = 0; // session in last 30d but not 7d
  let churned = 0; // no session in 30d

  for (const u of users) {
    const last = u.sessions[0]?.startedAt?.getTime();
    const isNew = now - u.createdAt.getTime() < 7 * DAY;
    if (last === undefined) {
      if (isNew) neu++;
      else churned++;
    } else if (now - last < 7 * DAY) {
      active++;
    } else if (now - last < 30 * DAY) {
      passive++;
    } else {
      churned++;
    }
  }

  return [
    { name: "Yangi", value: neu },
    { name: "Aktiv", value: active },
    { name: "Passiv", value: passive },
    { name: "Tashlab ketgan", value: churned },
  ];
}

export type CohortRetentionRow = {
  cohort: string; // e.g. "2026-08"
  size: number;
  w1: number; // % returned in week 1
  w2: number;
  m1: number; // % returned after 1 month
};

async function getCohortRetention(): Promise<CohortRetentionRow[]> {
  // Last 4 monthly cohorts
  const cohorts: { key: string; start: Date; end: Date }[] = [];
  const now = new Date();
  for (let i = 3; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    cohorts.push({
      key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      start,
      end,
    });
  }

  const rows: CohortRetentionRow[] = [];
  for (const c of cohorts) {
    const users = await prisma.user.findMany({
      where: { createdAt: { gte: c.start, lt: c.end }, role: { not: "ADMIN" } },
      select: { id: true, createdAt: true, sessions: { select: { startedAt: true } } },
    });
    const size = users.length;
    if (size === 0) {
      rows.push({ cohort: c.key, size: 0, w1: 0, w2: 0, m1: 0 });
      continue;
    }
    let w1 = 0;
    let w2 = 0;
    let m1 = 0;
    for (const u of users) {
      const reg = u.createdAt.getTime();
      const day = (t: number) => Math.floor((t - reg) / 86400000);
      const hasIn = (fromD: number, toD: number) =>
        u.sessions.some((s) => {
          const d = day(s.startedAt.getTime());
          return d >= fromD && d < toD;
        });
      if (hasIn(1, 8)) w1++;
      if (hasIn(8, 15)) w2++;
      if (hasIn(30, 61)) m1++;
    }
    rows.push({
      cohort: c.key,
      size,
      w1: Math.round((w1 / size) * 100),
      w2: Math.round((w2 / size) * 100),
      m1: Math.round((m1 / size) * 100),
    });
  }
  return rows;
}

export type HeatCell = { day: number; hour: number; value: number };

async function getActivityHeatmap(): Promise<HeatCell[]> {
  const since = new Date(Date.now() - 90 * 86400000);
  const sessions = await prisma.readingSession.findMany({
    where: { startedAt: { gte: since } },
    select: { startedAt: true },
  });

  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const s of sessions) {
    const d = s.startedAt.getDay(); // 0=Sun
    const h = s.startedAt.getHours();
    grid[d][h] += 1;
  }

  const dayLabels = [6, 0, 1, 2, 3, 4, 5]; // Mon..Sun order for display
  const cells: HeatCell[] = [];
  for (let di = 0; di < 7; di++) {
    const day = dayLabels[di];
    for (let h = 0; h < 24; h++) {
      cells.push({ day: di, hour: h, value: grid[day][h] });
    }
  }
  return cells;
}

// ─── D. System health ────────────────────────────────────────

export type UploadHealthPoint = { date: string; uploads: number; errors: number };

async function getUploadHealth(): Promise<UploadHealthPoint[]> {
  const since = new Date(Date.now() - 30 * 86400000);

  const [uploads, errors] = await Promise.all([
    prisma.book.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.bookContent.findMany({
      where: { status: "error", updatedAt: { gte: since } },
      select: { updatedAt: true },
    }),
  ]);

  const byDay = new Map<string, { uploads: number; errors: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    byDay.set(d.toISOString().slice(0, 10), { uploads: 0, errors: 0 });
  }
  for (const u of uploads) {
    const k = u.createdAt.toISOString().slice(0, 10);
    const rec = byDay.get(k);
    if (rec) rec.uploads++;
  }
  for (const e of errors) {
    const k = e.updatedAt.toISOString().slice(0, 10);
    const rec = byDay.get(k);
    if (rec) rec.errors++;
  }
  return Array.from(byDay.entries()).map(([date, v]) => ({ date, ...v }));
}

// ─── Aggregate ───────────────────────────────────────────────

export async function getDiagnosticsData() {
  const [
    zeroResultSearches,
    completion,
    funnel,
    sessionScatter,
    categoryBalance,
    categoryTrends,
    userSegments,
    cohortRetention,
    heatmap,
    uploadHealth,
  ] = await Promise.all([
    getZeroResultSearches(),
    getCompletionStats(),
    getReadingFunnel(),
    getSessionScatter(),
    getCategoryBalance(),
    getCategoryTrends(),
    getUserSegments(),
    getCohortRetention(),
    getActivityHeatmap(),
    getUploadHealth(),
  ]);

  return {
    completion,
    funnel,
    sessionScatter,
    categoryBalance,
    categoryTrends,
    userSegments,
    cohortRetention,
    heatmap,
    uploadHealth,
    zeroResultSearches,
  };
}

export type DiagnosticsData = Awaited<ReturnType<typeof getDiagnosticsData>>;
