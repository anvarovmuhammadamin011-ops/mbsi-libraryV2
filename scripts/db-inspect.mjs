import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
try {
  const authors = await prisma.author.findMany({
    select: { id: true, name: true, _count: { select: { books: true } } },
    orderBy: { name: "asc" },
  });
  console.log("== AUTHORS ==");
  for (const a of authors) console.log(`${a.name}  ->  ${a._count.books} books  (${a.id})`);

  const cats = await prisma.category.findMany({
    select: { id: true, name: true, _count: { select: { books: true } } },
    orderBy: { name: "asc" },
  });
  console.log("\n== CATEGORIES ==");
  for (const c of cats) console.log(`${c.name} -> ${c._count.books} books`);

  const books = await prisma.book.findMany({
    select: { id: true, title: true, slug: true, author: { select: { name: true } }, category: { select: { name: true } }, isPublished: true, coverUrl: true },
    orderBy: { title: "asc" },
  });
  console.log("\n== BOOKS ==");
  for (const b of books) console.log(`"${b.title}" | author=${b.author?.name} | cat=${b.category?.name} | pub=${b.isPublished} | cover=${b.coverUrl} | ${b.slug}`);

  const users = await prisma.user.findMany({ select: { id: true, name: true, role: true }, take: 50 });
  console.log("\n== USERS ==");
  for (const u of users) console.log(`${u.name} (${u.role})`);
} catch (e) {
  console.error(e.message);
} finally {
  await prisma.$disconnect();
}
