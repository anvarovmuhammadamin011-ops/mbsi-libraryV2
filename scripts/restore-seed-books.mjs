// O'chirilgan demo kitoblarni MA'LUMOTLARNI O'CHIRMASDAN qaytarish.
// Faqat: authors, categories, books, ratings upsert qilinadi.
// Sessiyalar, progress, bannerlar va boshqalarga tegilmaydi.
// Run: node scripts/restore-seed-books.mjs
import { PrismaClient } from "@prisma/client";
import { AUTHORS, CATEGORIES, BOOKS, RATINGS } from "../prisma/seed.mjs";

const prisma = new PrismaClient();

function slugify(input) {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return base || "book";
}

async function main() {
  for (const a of AUTHORS) {
    await prisma.author.upsert({
      where: { id: a.id },
      create: { id: a.id, name: a.name, biography: a.biography },
      update: { name: a.name, biography: a.biography },
    });
  }
  console.log(`authors: ${AUTHORS.length}`);

  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: c.id },
      create: { id: c.id, name: c.name, slug: c.slug, description: c.description, icon: c.icon },
      update: {},
    });
  }
  console.log(`categories: ${CATEGORIES.length}`);

  let restored = 0;
  for (const b of BOOKS) {
    const slug = slugify(b.title);
    const r = await prisma.book.upsert({
      where: { id: b.id },
      create: {
        id: b.id,
        title: b.title,
        slug,
        description: b.description,
        coverUrl: b.coverUrl,
        pdfUrl: b.pdfUrl ?? null,
        language: b.language,
        totalPages: b.totalPages,
        authorId: b.authorId,
        categoryId: b.categoryId,
        isPublished: b.isPublished,
              },
      update: {},
    });
    void r;
    restored++;
  }
  console.log(`books: ${restored}`);

  for (const r of RATINGS) {
    await prisma.rating.upsert({
      where: { userId_bookId: { userId: r.userId, bookId: r.bookId } },
      create: { userId: r.userId, bookId: r.bookId, rating: r.rating },
      update: {},
    });
  }
  console.log(`ratings: ${RATINGS.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
