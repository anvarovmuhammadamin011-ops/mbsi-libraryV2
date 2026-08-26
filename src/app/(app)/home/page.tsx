import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/server/auth";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Star,
  ArrowRight,
  Search,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sessionUser = await getSessionUser();
  const userId = sessionUser?.id;

  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : null;

  // Continue Reading — most recent active book
  const readingProgress = userId
    ? await prisma.readingProgress.findMany({
        where: { userId, completedAt: null },
        include: { book: { include: { author: true } } },
        orderBy: { lastReadAt: "desc" },
        take: 3,
      })
    : [];

  const mostRecentProgress = readingProgress[0] ?? null;

  // Featured Books — newest published
  const featuredBooks = await prisma.book.findMany({
    where: { isPublished: true },
    include: { author: true, ratings: { select: { rating: true } } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const displayName = user?.name?.split(" ")[0] || sessionUser?.name?.split(" ")[0] || "Reader";

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-20 md:pb-6 max-w-2xl mx-auto md:max-w-4xl lg:max-w-5xl">
      {/* ═══ HERO ═══ */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Hello, {displayName} 👋
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            What do you want to read today?
          </p>
        </div>

        {/* Search bar — navigates to /books */}
        <Link
          href="/books"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm hover:bg-muted/50 transition-colors"
        >
          <Search size={18} className="shrink-0 text-muted-foreground" />
          <span>Search books...</span>
        </Link>
      </div>

      {/* ═══ CONTINUE READING ═══ */}
      {readingProgress.length > 0 && (
        <section>
          <h2 className="text-base md:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            Continue Reading
          </h2>

          {/* Mobile: single large card */}
          <div className="md:hidden">
            {mostRecentProgress && (
              <ContinueReadingCard progress={mostRecentProgress} />
            )}
          </div>

          {/* Tablet / Desktop: horizontal row of cards */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {readingProgress.map((p) => (
              <ContinueReadingCard key={p.id} progress={p} compact />
            ))}
          </div>
        </section>
      )}

      {/* ═══ FEATURED BOOKS ═══ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base md:text-lg font-semibold text-foreground">Featured Books</h2>
          <Link
            href="/books"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {featuredBooks.length > 0 ? (
          <>
            {/* Mobile: horizontal scroll */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin snap-x snap-mandatory md:mx-0 md:px-0 md:overflow-visible md:flex-wrap md:snap-none">
              {featuredBooks.map((book) => {
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
                        {book.author?.name ?? "Unknown"}
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
          </>
        ) : (
          <div className="text-center py-10">
            <BookOpen size={32} className="mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No books yet.</p>
            <Link href="/books" className="text-sm text-primary hover:underline mt-2 inline-block">
              Browse books →
            </Link>
          </div>
        )}
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
              {p.book.author?.name ?? "Unknown author"}
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
              {p.book.author?.name ?? "Unknown author"}
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
              Continue <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
