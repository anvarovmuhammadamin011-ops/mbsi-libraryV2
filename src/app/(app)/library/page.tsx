import { getSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import { LibraryTabs, type ReadingItem, type SavedItem, type FinishedItem } from "@/components/library-tabs";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [readingRows, favoriteRows, finishedRows, totalBooks] = await Promise.all([
    prisma.readingProgress.findMany({
      where: { userId: user.id, completedAt: null },
      include: { book: { include: { author: true } } },
      orderBy: { lastReadAt: "desc" },
    }),
    prisma.favorite.findMany({
      where: { userId: user.id },
      include: { book: { include: { author: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.readingProgress.findMany({
      where: { userId: user.id, completedAt: { not: null } },
      include: { book: { include: { author: true } } },
      orderBy: { completedAt: "desc" },
    }),
    prisma.book.count({ where: { isPublished: true } }),
  ]);

  const reading: ReadingItem[] = readingRows
    .filter((r) => r.book)
    .map((r) => ({
      id: r.id,
      progress: r.progress,
      currentPage: r.currentPage,
      book: {
        id: r.book.id,
        title: r.book.title,
        slug: r.book.slug,
        coverUrl: r.book.coverUrl,
        authorName: r.book.author?.name ?? null,
      },
    }));

  const saved: SavedItem[] = favoriteRows
    .filter((f) => f.book)
    .map((f) => ({
      id: f.id,
      book: {
        id: f.book.id,
        title: f.book.title,
        slug: f.book.slug,
        coverUrl: f.book.coverUrl,
        authorName: f.book.author?.name ?? null,
      },
    }));

  const finished: FinishedItem[] = finishedRows
    .filter((r) => r.book)
    .map((r) => ({
      id: r.id,
      progress: r.progress,
      book: {
        id: r.book.id,
        title: r.book.title,
        slug: r.book.slug,
        coverUrl: r.book.coverUrl,
        authorName: r.book.author?.name ?? null,
      },
    }));

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0 max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">Shaxsiy kutubxonangiz</p>
        </div>
        <div className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
          Jami {totalBooks} kitob
        </div>
      </div>

      <LibraryTabs reading={reading} saved={saved} finished={finished} />
    </div>
  );
}
