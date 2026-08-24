import { prisma } from "@/lib/db";
import { BooksBrowser } from "@/components/books-browser";

export default async function BooksPage() {
  const [categories, authors] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
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
