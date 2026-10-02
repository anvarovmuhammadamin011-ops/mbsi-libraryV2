import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const books = await prisma.book.findMany({
  select: { id: true, title: true, slug: true, totalPages: true, isPublished: true,
    _count: { select: { progress: true, reviews: true, ratings: true, favorites: true, bookmarks: true } } },
  orderBy: { title: "asc" },
});

// "Qisqa" slug = <= 5 belgi yoki titldan butunlay farqli
const short = books.filter((b) => b.slug.length <= 5);
console.log(`Jami kitob: ${books.length}`);
console.log(`Slug uzunligi 5 yoki kam bo'lgan kitoblar: ${short.length}\n`);
for (const b of short) {
  const c = b._count;
  console.log(`slug: "${b.slug}" (${b.slug.length} belgi)`);
  console.log(`  sarlavha : ${b.title}`);
  console.log(`  sahifa   : ${b.totalPages} | published: ${b.isPublished}`);
  console.log(`  bog'liqlik: progress=${c.progress} reviews=${c.reviews} ratings=${c.ratings} favorites=${c.favorites} bookmarks=${c.bookmarks}`);
}
await prisma.$disconnect();