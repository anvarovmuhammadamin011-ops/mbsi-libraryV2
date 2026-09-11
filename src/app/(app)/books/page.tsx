import { prisma } from "@/lib/db";
import { BooksBrowser } from "@/components/books-browser";

export const dynamic = "force-dynamic";

export default async function BooksPage() {
  const [categories, authors] = await Promise.all([
    // Faqat kitobi bor kategoriyalar — bo'sh va test kategoriyalar filtrda ko'rinmaydi
    prisma.category.findMany({
      where: { books: { some: { isPublished: true } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.author.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <BooksBrowser
      categories={categories}
      authors={authors}
      initial={{ q: "", categoryId: "", language: "" }}
    />
  );
}
