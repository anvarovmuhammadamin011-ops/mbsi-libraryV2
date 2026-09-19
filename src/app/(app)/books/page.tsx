import { prisma } from "@/lib/db";
import { BooksBrowser } from "@/components/books-browser";

export const dynamic = "force-dynamic";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [categories, authors] = await Promise.all([
    // Faqat kitobi bor kategoriyalar — bo'sh va test kategoriyalar filtrda ko'rinmaydi
    prisma.category.findMany({
      where: { books: { some: { isPublished: true, pdfUrl: { not: null } } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.author.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <BooksBrowser
      categories={categories}
      authors={authors}
      initial={{
        q: params.q ?? "",
        categoryId: params.categoryId ?? "",
        language: params.language ?? "",
      }}
    />
  );
}
