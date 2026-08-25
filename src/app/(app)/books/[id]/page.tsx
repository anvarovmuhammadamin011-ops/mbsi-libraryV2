import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSessionUser } from "@/lib/server/auth";
import { getBookBySlug } from "@/lib/server/books";
import { isFavorite } from "@/lib/server/reading";
import { BookCardView } from "@/components/book-card-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, BookOpen, ArrowLeft, Heart } from "lucide-react";

export const dynamic = "force-dynamic";

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/books" />}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={15} /> Orqaga
      </Button>

      {/* Book layout */}
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Cover */}
        <div className="mx-auto w-full max-w-[240px] shrink-0 md:mx-0">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-lg shadow-black/10">
            <Image
              src={book.coverUrl}
              alt={book.title}
              fill
              className="object-cover"
              sizes="240px"
              priority
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {book.title}
          </h1>
          <p className="mt-1.5 text-base text-muted-foreground">
            {book.author?.name}
          </p>

          {/* Meta */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {book.category && (
              <Badge variant="outline" className="text-xs">{book.category.name}</Badge>
            )}
            <Badge variant="secondary" className="text-xs">{book.language}</Badge>
            <Badge variant="secondary" className="gap-1 text-xs">
              <Star size={11} className="fill-yellow-400 text-yellow-400" />
              {book.averageRating ?? 0}
            </Badge>
            <Badge variant="secondary" className="text-xs">{book.totalPages} bet</Badge>
            <Badge className="gap-1 text-xs bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">🪙 {book.coinReward ?? 10} coin</Badge>
          </div>

          {/* Description */}
          {book.description && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-foreground mb-1.5">Kitob haqida</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {book.description}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button render={<Link href={`/reader/${book.slug}`} />} className="gap-2 h-10">
              <BookOpen size={16} /> O'qishni boshlash
            </Button>
            <Button variant="outline" className="gap-2 h-10">
              <Heart size={16} /> {fav ? "Sevimlilardan o'chirish" : "Sevimlilarga qo'shish"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
