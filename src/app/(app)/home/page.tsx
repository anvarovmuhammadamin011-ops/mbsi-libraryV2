import Link from "next/link";
import { getSessionUser } from "@/lib/server/auth";
import { listContinueReading } from "@/lib/server/reading";
import { listBooks, listActiveBanners, listActiveRecommendations } from "@/lib/server/books";
import { BookCardView } from "@/components/book-card-view";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, ArrowRight, Library } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [continueReading, recommended, banners, recommendations] = await Promise.all([
    listContinueReading(user.id, 10),
    listBooks(
      {
        q: undefined,
        language: undefined,
        categoryId: undefined,
        authorId: undefined,
        rating: undefined,
        sort: "newest",
        page: 1,
        pageSize: 12,
        publishedOnly: true,
      },
      { includeUnpublished: false }
    ),
    listActiveBanners(),
    listActiveRecommendations(),
  ]);

  const greeting = new Date().getHours() < 12
    ? "Xayrli ertalab"
    : new Date().getHours() < 18
      ? "Xush kun"
      : "Xush kech";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting + Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-accent to-background p-6 sm:p-8">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-primary mb-1">
            {greeting} 👋
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {user.name}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Bugun nimani o'qishni xohlaysiz? Kutubxonada 24+ kitob sizni kutmoqda.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button render={<Link href="/books" />} className="gap-2 h-10">
              <Library size={16} /> Kutubxonaga o'tish
            </Button>
            <Button variant="outline" render={<Link href="/ranking" />} className="gap-2 h-10">
              <Sparkles size={16} /> Reyting
            </Button>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/5" />
        <div className="absolute -right-4 bottom-0 h-24 w-24 rounded-full bg-primary/8" />
      </section>

      {/* Continue reading */}
      {continueReading.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">O'qishni davom ettirish</h2>
            <Link
              href="/continue-reading"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Barchasi <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {continueReading.map((p) => (
              <BookCardView key={p.bookId} book={p.book!} progress={p} />
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Tavsiyalar</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recommendations.map((r) => (
              <div key={r.id} className="space-y-3">
                <div>
                  <h3 className="font-medium text-foreground">{r.title}</h3>
                  {r.description && (
                    <p className="text-sm text-muted-foreground">{r.description}</p>
                  )}
                </div>
                <BookCardView book={r.book} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* New books */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Yangi kitoblar</h2>
          <Link
            href="/books"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Barchasi <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {recommended.data.map((b) => (
            <BookCardView key={b.id} book={b} />
          ))}
        </div>
      </section>
    </div>
  );
}
