import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/server/auth";
import { getBookBySlug } from "@/lib/server/books";
import { isFavorite } from "@/lib/server/reading";
import { BookCardView } from "@/components/book-card-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, BookOpen, ArrowLeft } from "lucide-react";

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
    <div className="space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/books" />} className="gap-2">
        <ArrowLeft size={16} /> Orqaga
      </Button>

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <div className="space-y-3">
          <BookCardView book={book} initialFavorite={fav} />
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{book.title}</h1>
            <p className="text-muted-foreground">{book.author?.name}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {book.category && <Badge variant="outline">{book.category.name}</Badge>}
            <Badge variant="secondary">{book.language}</Badge>
            <Badge variant="secondary" className="gap-1">
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
              {book.averageRating ?? 0} ({book.ratingCount ?? 0})
            </Badge>
            <Badge variant="secondary">{book.totalPages} bet</Badge>
          </div>

          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {book.description || "Tavsif mavjud emas."}
          </p>

          <div className="flex gap-2">
            <Button render={<Link href={`/reader/${book.slug}`} />} className="gap-2">
              <BookOpen size={16} /> O'qishni boshlash
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
