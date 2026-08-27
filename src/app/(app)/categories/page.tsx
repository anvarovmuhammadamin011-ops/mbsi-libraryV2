import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Star, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Categories — MBSI Library" };

// Category icon map
const CATEGORY_ICONS: Record<string, string> = {
  it: "💻",
  fiction: "📖",
  science: "🔬",
  history: "🏛️",
  psychology: "🧠",
  business: "💼",
  education: "📚",
  literature: "✍️",
  technology: "⚙️",
  philosophy: "🤔",
  art: "🎨",
  religion: "🕌",
  economy: "📈",
  law: "⚖️",
  medicine: "🏥",
  sports: "⚽",
  music: "🎵",
  travel: "✈️",
  cooking: "🍳",
};

function getCategoryIcon(name: string, slug: string): string {
  const lower = name.toLowerCase();
  if (CATEGORY_ICONS[lower]) return CATEGORY_ICONS[lower];
  if (CATEGORY_ICONS[slug]) return CATEGORY_ICONS[slug];
  return "📚";
}

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { books: true } },
    },
  });

  // Get first 3 book covers per category for preview
  const categoryIds = categories.map((c) => c.id);
  const categoryBooks = await prisma.book.findMany({
    where: { categoryId: { in: categoryIds }, isPublished: true },
    select: { categoryId: true, coverUrl: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  const coverMap: Record<string, string[]> = {};
  for (const b of categoryBooks) {
    if (!coverMap[b.categoryId]) coverMap[b.categoryId] = [];
    if (coverMap[b.categoryId].length < 3 && b.coverUrl) {
      coverMap[b.categoryId].push(b.coverUrl);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-6 max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Categories
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse books by category
        </p>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen size={32} className="text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {categories.map((cat) => {
            const icon = getCategoryIcon(cat.name, cat.slug);
            const covers = coverMap[cat.id] ?? [];
            const bookCount = cat._count.books;

            return (
              <Link
                key={cat.id}
                href={`/books?categoryId=${cat.id}`}
                className="group rounded-2xl border border-border bg-card p-4 hover:shadow-md hover:bg-muted/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                    {icon}
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-muted-foreground group-hover:text-primary transition-colors mt-1"
                  />
                </div>

                <h3 className="text-base font-semibold text-foreground mb-0.5">
                  {cat.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {bookCount} {bookCount === 1 ? "book" : "books"}
                </p>

                {/* Mini book covers */}
                {covers.length > 0 && (
                  <div className="flex gap-1.5">
                    {covers.map((url, i) => (
                      <div
                        key={i}
                        className="relative h-12 w-9 overflow-hidden rounded-md bg-muted"
                      >
                        <Image
                          src={url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
