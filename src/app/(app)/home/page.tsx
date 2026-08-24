import Link from "next/link";
import { getSessionUser } from "@/lib/server/auth";
import { listContinueReading } from "@/lib/server/reading";
import { listBooks, listActiveBanners, listActiveRecommendations } from "@/lib/server/books";
import { BookCardView } from "@/components/book-card-view";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles } from "lucide-react";

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

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-card to-card p-8">
        <div className="max-w-xl">
          <h1 className="text-3xl font-bold tracking-tight">
            MBSI Raqamli Kutubxonasi
          </h1>
          <p className="mt-2 text-muted-foreground">
            Kitoblaringizni online o'qing, o'qish jarayonini kuzating va
            reytingda yuqoriga chiqing.
          </p>
          <div className="mt-4 flex gap-2">
            <Button render={<Link href="/books" />} className="gap-2">
              <BookOpen size={16} /> Kutubxonaga o'tish
            </Button>
            <Button variant="outline" render={<Link href="/ranking" />} className="gap-2">
              <Sparkles size={16} /> Reyting
            </Button>
          </div>
        </div>
      </section>

      {/* Banners */}
      {banners.length > 0 && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((b) => (
            <Link
              key={b.id}
              href={b.link || "#"}
              className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-card to-card p-5 transition hover:shadow-md"
            >
              {b.imageUrl && (
                <img
                  src={b.imageUrl}
                  alt={b.title}
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20 transition group-hover:opacity-30"
                />
              )}
              <div className="relative">
                <h3 className="text-lg font-semibold">{b.title}</h3>
                {b.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>
                )}
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* Continue reading */}
      {continueReading.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">O'qishni davom ettirish</h2>
            <Link href="/continue-reading" className="text-sm text-primary hover:underline">
              Barchasi
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
            <h2 className="text-xl font-semibold">Tavsiyalar</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recommendations.map((r) => (
              <div key={r.id} className="space-y-3">
                <div>
                  <h3 className="font-medium">{r.title}</h3>
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

      {/* Recommended / newest */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Yangi kitoblar</h2>
          <Link href="/books" className="text-sm text-primary hover:underline">
            Barchasi
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {recommended.data.map((b) => (
            <BookCardView key={b.id} book={b} />
          ))}
        </div>
      </section>
    </div>
  );
}
