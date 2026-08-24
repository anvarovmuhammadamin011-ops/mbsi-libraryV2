import { prisma } from "@/lib/db";
import { BooksBrowser } from "@/components/books-browser";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const [categories, authors] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.author.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Qidiruv</h1>
        <p className="mt-1 text-muted-foreground">
          Kitoblar, mualliflar va kategoriyalar bo&apos;yicha qidiruv
        </p>
      </div>
      <BooksBrowser
        categories={categories}
        authors={authors}
        initial={{ q, categoryId: "", language: "" }}
      />
    </div>
  );
}
