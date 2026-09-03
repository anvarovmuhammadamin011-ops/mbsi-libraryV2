import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/server/auth";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Star,
  ArrowRight,
  Search,
  LayoutGrid,
  Flame,
} from "lucide-react";
import { getAiRecommendations, getSmartDiscoverySections } from "@/lib/server/ai-recommendations";
import { computeStreak } from "@/lib/server/reading";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sessionUser = await getSessionUser();
  const userId = sessionUser?.id;

  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : null;

  // Continue Reading — most recent active books
  const readingProgress = userId
    ? await prisma.readingProgress.findMany({
        where: { userId, completedAt: null },
        include: { book: { include: { author: true } } },
        orderBy: { lastReadAt: "desc" },
        take: 4,
      })
    : [];

  const mostRecentProgress = readingProgress[0] ?? null;

  // ── Yangi kitoblar (newest 10)
  const yangiKitoblar = await prisma.book.findMany({
    where: { isPublished: true },
    include: { author: true, ratings: { select: { rating: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // ── Top 10 talik (eng ko'p o'qilgan)
  const topIds = await prisma.readingSession.groupBy({
    by: ["bookId"],
    _count: { bookId: true },
    orderBy: { _count: { bookId: "desc" } },
    take: 10,
  });
  const top10Books =
    topIds.length > 0
      ? await prisma.book.findMany({
          where: { id: { in: topIds.map((t) => t.bookId) }, isPublished: true },
          include: { author: true, ratings: { select: { rating: true } } },
        })
      : [];
  const top10Ordered = topIds
    .map((t) => top10Books.find((b) => b.id === t.bookId))
    .filter(Boolean) as typeof yangiKitoblar;

  // ── Eng zo'rlari (eng yuqori reyting)
  const ratedGroups = await prisma.rating.groupBy({
    by: ["bookId"],
    _avg: { rating: true },
    _count: { bookId: true },
    having: { rating: { _avg: { gte: 4 } } },
    orderBy: { _avg: { rating: "desc" } },
    take: 10,
  });
  let engZorlari: typeof yangiKitoblar = [];
  if (ratedGroups.length > 0) {
    const ids = ratedGroups.map((g) => g.bookId);
    const books = await prisma.book.findMany({
      where: { id: { in: ids }, isPublished: true },
      include: { author: true, ratings: { select: { rating: true } } },
    });
    engZorlari = ratedGroups
      .map((g) => books.find((b) => b.id === g.bookId))
      .filter(Boolean) as typeof yangiKitoblar;
  }
  if (engZorlari.length < 4) {
    const fallback = await prisma.book.findMany({
      where: { isPublished: true },
      include: { author: true, ratings: { select: { rating: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const seen = new Set(engZorlari.map((b) => b.id));
    for (const b of fallback) if (!seen.has(b.id) && engZorlari.length < 10) engZorlari.push(b);
  }

  // ── Categories with book counts
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { books: true } },
    },
  });

  // ── Sizga mos kitoblar (personalized)
  let sizgaMos: typeof yangiKitoblar = [];
  if (userId) {
    const userProgress = await prisma.readingProgress.findMany({
      where: { userId },
      select: { bookId: true },
    });
    const readIds = userProgress.map((p) => p.bookId);
    if (readIds.length > 0) {
      const readBooks = await prisma.book.findMany({
        where: { id: { in: readIds } },
        select: { categoryId: true },
      });
      const catCount: Record<string, number> = {};
      for (const b of readBooks) if (b.categoryId) catCount[b.categoryId] = (catCount[b.categoryId] || 0) + 1;
      const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (topCat) {
        sizgaMos = await prisma.book.findMany({
          where: { categoryId: topCat, isPublished: true, id: { notIn: readIds } },
          include: { author: true, ratings: { select: { rating: true } } },
          take: 10,
        });
      }
    }
  }
  if (sizgaMos.length === 0) {
    sizgaMos = await prisma.book.findMany({
      where: { isPublished: true },
      include: { author: true, ratings: { select: { rating: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  }

  const displayName = user?.name?.split(" ")[0] || sessionUser?.name?.split(" ")[0] || "Reader";

  const streakSessions = userId
    ? await prisma.readingSession.findMany({ where: { userId }, select: { startedAt: true } })
    : [];
  const streak = computeStreak(streakSessions.map((s) => s.startedAt));

  const aiRecs = userId ? await getAiRecommendations(userId, 6) : [];
  const smart = userId
    ? await getSmartDiscoverySections(userId)
    : { becauseYouRead: null, continueJourney: null, youMayAlsoLike: [] as any[] };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-20 md:pb-6 max-w-2xl mx-auto md:max-w-4xl lg:max-w-5xl">
      {/* ═══ HERO ═══ */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Salom, {displayName} 👋
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Bugun nima o'qimoqchisiz?
          </p>
        </div>

        {/* Search bar — navigates to /search */}
        <Link
          href="/search"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm hover:bg-muted/50 transition-colors"
        >
          <Search size={18} className="shrink-0 text-muted-foreground" />
          <span>Kitoblar, mualliflar, kategoriyalar qidirish...</span>
        </Link>
        {streak > 0 && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 dark:bg-orange-950/20 px-3 py-1 text-xs font-medium text-orange-600 dark:text-orange-400 w-fit">
            <Flame size={12} /> {streak} kunlik streak
          </div>
        )}
      </div>

      {/* ═══ AI RECOMMENDATIONS — Phase 5 ═══ */}
      {aiRecs.length > 0 && (
        <section>
          <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            ✨ Sizga tavsiya etiladi
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            {aiRecs[0]?.reason ?? "Sizning o'qish tarixingiz asosida"}
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin snap-x snap-mandatory md:mx-0 md:px-0 md:overflow-visible md:flex-wrap md:snap-none">
            {aiRecs.map(({ book, reason }) => {
              const avg = (book as any).averageRating ?? 0;
              return (
                <Link
                  key={book.id}
                  href={`/books/${book.slug}`}
                  className="group shrink-0 snap-start w-[140px] md:w-[150px] lg:w-[160px]"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-muted">
                    {book.coverUrl ? (
                      <Image src={book.coverUrl} alt={book.title} fill className="object-cover group-hover:scale-[1.02] transition-transform" sizes="160px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500/10 to-indigo-500/10">
                        <BookOpen size={28} className="text-violet-500/40" />
                      </div>
                    )}
                  </div>
                  <div className="pt-2">
                    <p className="text-xs md:text-sm font-semibold line-clamp-2 leading-tight">{book.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{book.author?.name}</p>
                    <p className="text-[11px] text-violet-600 dark:text-violet-400 mt-1 line-clamp-2">{reason}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══ SMART DISCOVERY — Phase 5 ═══ */}
      {smart.becauseYouRead && (
        <section>
          <h2 className="text-base md:text-lg font-semibold text-foreground mb-3">
            ✨ {smart.becauseYouRead.category} o'qiganingiz uchun
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin snap-x snap-mandatory md:mx-0 md:px-0">
            {smart.becauseYouRead.books.map(({ book }: any) => (
              <Link key={book.id} href={`/books/${book.slug}`} className="shrink-0 snap-start w-[140px] group">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
                  {book.coverUrl ? <Image src={book.coverUrl} alt={book.title} fill className="object-cover" sizes="140px" /> : <div className="flex h-full items-center justify-center bg-muted"><BookOpen size={28} className="text-muted-foreground/30" /></div>}
                </div>
                <p className="text-xs font-semibold line-clamp-2 mt-2">{book.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
      {smart.youMayAlsoLike && smart.youMayAlsoLike.length > 0 && (
        <section>
          <h2 className="text-base md:text-lg font-semibold mb-3">✨ Sizga yoqishi mumkin</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin snap-x snap-mandatory md:mx-0 md:px-0">
            {smart.youMayAlsoLike.map(({ book }: any) => (
              <Link key={book.id} href={`/books/${book.slug}`} className="shrink-0 snap-start w-[140px] group">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
                  {book.coverUrl ? <Image src={book.coverUrl} alt={book.title} fill className="object-cover" sizes="140px" /> : <div className="flex h-full items-center justify-center bg-muted"><BookOpen size={28} className="text-muted-foreground/30" /></div>}
                </div>
                <p className="text-xs font-semibold line-clamp-2 mt-2">{book.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══ CONTINUE READING ═══ */}
      {readingProgress.length > 0 && (
        <section>
          <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            Davom ettirish
          </h2>

          {/* Mobile: single large card */}
          <div className="md:hidden">
            {mostRecentProgress && (
              <ContinueReadingCard progress={mostRecentProgress} />
            )}
          </div>

          {/* Tablet / Desktop: horizontal row of cards */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {readingProgress.map((p) => (
              <ContinueReadingCard key={p.id} progress={p} compact />
            ))}
          </div>
        </section>
      )}

      {/* ═══ CATEGORIES ═══ */}
      {categories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
              <LayoutGrid size={18} className="text-primary" />
              Kategoriyalar
            </h2>
            <Link
              href="/categories"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Hammasi <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin snap-x snap-mandatory md:mx-0 md:px-0 md:overflow-visible md:flex-wrap md:snap-none">
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                href={`/books?categoryId=${cat.id}`}
                className="shrink-0 snap-start rounded-2xl border border-border bg-card px-4 py-3 hover:bg-muted/50 hover:shadow-sm transition-all min-w-[120px] md:min-w-0 md:flex-1 md:max-w-[160px]"
              >
                <p className="text-sm font-semibold text-foreground truncate">
                  {cat.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cat._count.books} kitob
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══ YANGI KITOBLAR ═══ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base md:text-lg font-semibold text-foreground">🆕 Yangi kitoblar</h2>
          <Link
            href="/books"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Hammasi <ArrowRight size={14} />
          </Link>
        </div>

        {yangiKitoblar.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin snap-x snap-mandatory md:mx-0 md:px-0 md:overflow-visible md:flex-wrap md:snap-none">
            {yangiKitoblar.map((book) => {
              const avgRating =
                (book as any).ratings?.length > 0
                  ? (
                      (book as any).ratings.reduce((s: number, r: { rating: number }) => s + r.rating, 0) /
                      (book as any).ratings.length
                    ).toFixed(1)
                  : "—";
              return (
                <Link
                  key={book.id}
                  href={`/books/${book.slug}`}
                  className="group shrink-0 snap-start w-[140px] md:w-[150px] lg:w-[160px]"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-muted">
                    {book.coverUrl ? (
                      <Image
                        src={book.coverUrl}
                        alt={book.title}
                        fill
                        className="object-cover group-hover:scale-[1.02] transition-transform"
                        sizes="(max-width: 640px) 140px, (max-width: 1024px) 150px, 160px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <BookOpen size={28} className="text-primary/30" />
                      </div>
                    )}
                  </div>
                  <div className="pt-2">
                    <p className="text-xs md:text-sm font-semibold text-foreground line-clamp-2 leading-tight">
                      {book.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {book.author?.name ?? "Noma'lum"}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{avgRating}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <BookOpen size={32} className="mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">Hali kitoblar yo'q.</p>
            <Link href="/books" className="text-sm text-primary hover:underline mt-2 inline-block">
              Kitoblarni ko'rish →
            </Link>
          </div>
        )}
      </section>

      {/* ═══ TOP 10 TALIK ═══ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base md:text-lg font-semibold text-foreground">🏆 Eng mashhur</h2>
          <Link
            href="/books?sort=popular"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Hammasi <ArrowRight size={14} />
          </Link>
        </div>
        {top10Ordered.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin snap-x snap-mandatory md:mx-0 md:px-0 md:overflow-visible md:flex-wrap md:snap-none">
            {top10Ordered.map((book, idx) => {
              const avgRating =
                (book as any).ratings?.length > 0
                  ? (
                      (book as any).ratings.reduce((s: number, r: { rating: number }) => s + r.rating, 0) /
                      (book as any).ratings.length
                    ).toFixed(1)
                  : "—";
              return (
                <Link
                  key={book.id}
                  href={`/books/${book.slug}`}
                  className="group shrink-0 snap-start w-[140px] md:w-[150px] lg:w-[160px] relative"
                >
                  <div className="absolute -top-2 -left-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow">
                    {idx + 1}
                  </div>
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-muted">
                    {book.coverUrl ? (
                      <Image
                        src={book.coverUrl}
                        alt={book.title}
                        fill
                        className="object-cover group-hover:scale-[1.02] transition-transform"
                        sizes="160px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <BookOpen size={28} className="text-primary/30" />
                      </div>
                    )}
                  </div>
                  <div className="pt-2">
                    <p className="text-xs md:text-sm font-semibold text-foreground line-clamp-2 leading-tight">
                      {book.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {book.author?.name ?? "Noma'lum"}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{avgRating}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">Hali o'qilgan kitoblar yo'q</p>
        )}
      </section>

      {/* ═══ ENG ZO'RLARI ═══ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base md:text-lg font-semibold text-foreground">⭐ Eng yuqori reyting</h2>
          <Link
            href="/books?sort=rating"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Hammasi <ArrowRight size={14} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin snap-x snap-mandatory md:mx-0 md:px-0 md:overflow-visible md:flex-wrap md:snap-none">
          {engZorlari.map((book) => {
            const avgRating =
              (book as any).ratings?.length > 0
                ? (
                    (book as any).ratings.reduce((s: number, r: { rating: number }) => s + r.rating, 0) /
                    (book as any).ratings.length
                  ).toFixed(1)
                : "—";
            return (
              <Link
                key={book.id}
                href={`/books/${book.slug}`}
                className="group shrink-0 snap-start w-[140px] md:w-[150px] lg:w-[160px]"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-muted">
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl}
                      alt={book.title}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform"
                      sizes="160px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <BookOpen size={28} className="text-primary/30" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5">
                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-[11px] font-bold text-white">{avgRating}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-xs md:text-sm font-semibold text-foreground line-clamp-2 leading-tight">
                    {book.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {book.author?.name ?? "Noma'lum"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ═══ SIZGA MOS KITOBLAR ═══ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base md:text-lg font-semibold text-foreground">💎 Sizga mos kitoblar</h2>
          <Link
            href="/books"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Hammasi <ArrowRight size={14} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin snap-x snap-mandatory md:mx-0 md:px-0 md:overflow-visible md:flex-wrap md:snap-none">
          {sizgaMos.map((book) => {
            const avgRating =
              (book as any).ratings?.length > 0
                ? (
                    (book as any).ratings.reduce((s: number, r: { rating: number }) => s + r.rating, 0) /
                    (book as any).ratings.length
                  ).toFixed(1)
                : "—";
            return (
              <Link
                key={book.id}
                href={`/books/${book.slug}`}
                className="group shrink-0 snap-start w-[140px] md:w-[150px] lg:w-[160px]"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-muted">
                  {book.coverUrl ? (
                    <Image
                      src={book.coverUrl}
                      alt={book.title}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform"
                      sizes="160px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <BookOpen size={28} className="text-primary/30" />
                    </div>
                  )}
                </div>
                <div className="pt-2">
                  <p className="text-xs md:text-sm font-semibold text-foreground line-clamp-2 leading-tight">
                    {book.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {book.author?.name ?? "Noma'lum"}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{avgRating}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────────── */

function ContinueReadingCard({
  progress,
  compact = false,
}: {
  progress: any;
  compact?: boolean;
}) {
  const p = progress;
  const totalP = p.book.totalPages || 320;
  const pct = Math.min(Math.round((p.currentPage / totalP) * 100), 100);

  if (compact) {
    return (
      <Link
        href={`/reader/${p.book.slug}`}
        className="group rounded-2xl border border-border bg-card p-3 shadow-sm hover:shadow-md transition-shadow flex gap-3"
      >
        <div className="shrink-0">
          <div className="relative h-[90px] w-[65px] overflow-hidden rounded-lg bg-muted">
            {p.book.coverUrl ? (
              <Image
                src={p.book.coverUrl}
                alt={p.book.title}
                fill
                className="object-cover"
                sizes="65px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <BookOpen size={22} className="text-primary/40" />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between min-w-0 py-0.5">
          <div>
            <h3 className="text-sm font-bold leading-tight text-foreground line-clamp-2">
              {p.book.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {p.book.author?.name ?? "Noma'lum muallif"}
            </p>
          </div>
          <div className="space-y-1.5 mt-2">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {pct}%
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Mobile: single large card
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="shrink-0">
          <div className="relative h-[120px] w-[80px] overflow-hidden rounded-lg bg-muted">
            {p.book.coverUrl ? (
              <Image
                src={p.book.coverUrl}
                alt={p.book.title}
                fill
                className="object-cover"
                sizes="80px"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <BookOpen size={28} className="text-primary/40" />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between min-w-0 py-1">
          <div>
            <h3 className="text-sm font-bold leading-tight text-foreground line-clamp-2">
              {p.book.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {p.book.author?.name ?? "Noma'lum muallif"}
            </p>
          </div>
          <div className="space-y-3 mt-3">
            <div className="space-y-1.5">
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {pct}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {p.currentPage} / {totalP}
                </span>
              </div>
            </div>
            <Link
              href={`/reader/${p.book.slug}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Davom ettirish <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
