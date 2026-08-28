import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSessionUser } from "@/lib/server/auth";
import { getBookBySlug } from "@/lib/server/books";
import { isFavorite } from "@/lib/server/reading";
import { prisma } from "@/lib/db";
import { ArrowLeft, Star } from "lucide-react";
import {
  FavoriteHeartButton,
  LibraryToggleButton,
} from "@/components/book-detail-client";
import { ReviewSection } from "@/components/review-section";

export const dynamic = "force-dynamic";

function formatReaders(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

function formatRating(v: number | undefined): string {
  const n = v ?? 0;
  return n.toFixed(1);
}

function langLabel(lang: string): string {
  if (lang === "UZ") return "Uzbek";
  if (lang === "RU") return "Rus";
  if (lang === "EN") return "English";
  return lang;
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return null;
  const book = await getBookBySlug(id);
  if (!book) notFound();

  const fav = await isFavorite(user.id, book.id);

  const ratings = await prisma.rating.findMany({
    where: { bookId: book.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const avg = book.averageRating ?? 0;
  const readerCount = (book as any).readerCount ?? (book as any).totalReaders ?? 0;

  const hasStarted = !!(await prisma.readingProgress.findUnique({
    where: { userId_bookId: { userId: user.id, bookId: book.id } },
  }));
  const reviews = await prisma.review.findMany({
    where: { bookId: book.id, isHidden: false },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const userReview = reviews.find((r) => r.userId === user.id) ?? null;
  const userRating = await prisma.rating.findUnique({
    where: { userId_bookId: { userId: user.id, bookId: book.id } },
  });

  return (
    <div className="mx-auto max-w-md md:max-w-3xl lg:max-w-4xl px-4 pb-10 animate-fade-in">
      {/* ═══ MOBILE LAYOUT (md below) ═══ */}
      <div className="md:hidden">
        <MobileBookDetail
          book={book}
          avg={avg}
          readerCount={readerCount}
          fav={fav}
          hasStarted={hasStarted}
          reviews={reviews}
          userReview={userReview}
          userRating={userRating?.rating ?? null}
          currentUserId={user.id}
        />
      </div>

      {/* ═══ TABLET / DESKTOP LAYOUT (md+) ═══ */}
      <div className="hidden md:block">
        {/* Back button */}
        <div className="flex items-center justify-between py-3">
          <Link
            href="/books"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </Link>
          <FavoriteHeartButton bookId={book.id} initialFavorite={fav} />
        </div>

        {/* Two-column layout */}
        <div className="flex gap-8 mt-4">
          {/* Left: Cover */}
          <div className="shrink-0">
            <div className="relative h-[320px] md:h-[360px] w-[220px] md:w-[240px] overflow-hidden rounded-2xl shadow-xl shadow-black/10 bg-muted">
              {book.coverUrl ? (
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 220px, 240px"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-sm">
                  No cover
                </div>
              )}
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex-1 min-w-0 pt-2">
            <h1 className="text-2xl lg:text-3xl font-bold leading-tight text-foreground">
              {book.title}
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              {book.author?.name ?? "Noma'lum muallif"}
            </p>

            <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-foreground">
                  {formatRating(avg)} / 5
                </span>
              </div>
              <span>·</span>
              <span>{formatReaders(readerCount)} readers</span>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex flex-col gap-3 max-w-[280px]">
              <Link
                href={`/reader/${book.slug}`}
                className="flex h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold tracking-wide text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                READ NOW
              </Link>
              <LibraryToggleButton bookId={book.id} initialFavorite={fav} />
            </div>

            {/* About */}
            <div className="mt-8">
              <h2 className="text-base font-semibold text-foreground">
                About this book
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {book.description?.trim()
                  ? book.description
                  : "Kitob haqida qisqa description."}
              </p>
            </div>

            {/* Information */}
            <div className="mt-6">
              <h2 className="text-base font-semibold text-foreground">Information</h2>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl bg-muted/50 p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Language</p>
                  <p className="text-sm font-medium text-foreground">
                    {langLabel(book.language)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pages</p>
                  <p className="text-sm font-medium text-foreground">
                    {book.totalPages}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-sm font-medium text-foreground">
                    {book.category?.name ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="flex items-center gap-1 text-sm font-medium text-foreground">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    {formatRating(avg)} / 5
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ReviewSection
          bookId={book.id}
          currentUserId={user.id}
          hasStarted={hasStarted}
          initialReviews={reviews as any}
          initialUserReview={userReview as any}
          initialUserRating={userRating?.rating ?? null}
        />
      </div>
    </div>
  );
}

/* ─── Mobile-only book detail ────────────────────────────── */

function MobileBookDetail({
  book,
  avg,
  readerCount,
  fav,
  hasStarted,
  reviews,
  userReview,
  userRating,
  currentUserId,
}: {
  book: any;
  avg: number;
  readerCount: number;
  fav: boolean;
  hasStarted: boolean;
  reviews: any[];
  userReview: any;
  userRating: number | null;
  currentUserId: string;
}) {
  return (
    <>
      {/* Top bar */}
      <div className="flex items-center justify-between py-3">
        <Link
          href="/books"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </Link>
        <FavoriteHeartButton bookId={book.id} initialFavorite={fav} />
      </div>

      {/* Center cover + meta */}
      <div className="flex flex-col items-center text-center">
        <div className="relative h-[280px] w-[200px] overflow-hidden rounded-2xl shadow-xl shadow-black/10 bg-muted">
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={book.title}
              fill
              className="object-cover"
              sizes="200px"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-sm">
              No cover
            </div>
          )}
        </div>

        <h1 className="mt-5 text-xl font-bold leading-tight text-foreground">
          {book.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {book.author?.name ?? "Noma'lum muallif"}
        </p>

        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Star size={14} className="fill-yellow-400 text-yellow-400" />
          <span className="font-medium text-foreground">
            {formatRating(avg)} / 5
          </span>
          <span>·</span>
          <span>{formatReaders(readerCount)} readers</span>
        </div>

        {/* Buttons stacked full width */}
        <div className="mt-6 w-full space-y-3">
          <Link
            href={`/reader/${book.slug}`}
            className="flex h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold tracking-wide text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            READ NOW
          </Link>
          <LibraryToggleButton bookId={book.id} initialFavorite={fav} />
        </div>
      </div>

      {/* About */}
      <div className="mt-8">
        <h2 className="text-base font-semibold text-foreground">
          About this book
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {book.description?.trim()
            ? book.description
            : "Kitob haqida qisqa description."}
        </p>
      </div>

      {/* Information */}
      <div className="mt-6">
        <h2 className="text-base font-semibold text-foreground">Information</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 rounded-2xl bg-muted/50 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Language</p>
            <p className="text-sm font-medium text-foreground">
              {langLabel(book.language)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pages</p>
            <p className="text-sm font-medium text-foreground">
              {book.totalPages}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Category</p>
            <p className="text-sm font-medium text-foreground">
              {book.category?.name ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Rating</p>
            <p className="flex items-center gap-1 text-sm font-medium text-foreground">
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
              {formatRating(avg)}
            </p>
          </div>
        </div>
      </div>

      <ReviewSection
        bookId={book.id}
        currentUserId={currentUserId}
        hasStarted={hasStarted}
        initialReviews={reviews as any}
        initialUserReview={userReview as any}
        initialUserRating={userRating}
      />
    </>
  );
}
