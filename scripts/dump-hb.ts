import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const books = await p.book.findMany({
    where: { pdfUrl: { not: null } },
    select: {
      id: true,
      title: true,
      authorId: true,
      categoryId: true,
      totalPages: true,
      coverUrl: true,
      pdfUrl: true,
    },
    orderBy: { title: "asc" },
  });
  console.log("total:", books.length);
  for (const b of books) {
    const a = await p.author.findUnique({ where: { id: b.authorId } });
    const c = await p.category.findUnique({ where: { id: b.categoryId } });
    console.log(`{ id:"${b.id}", t:"${b.title}", a:"${b.authorId}", an:"${a?.name}", c:"${b.categoryId}", cn:"${c?.name}", p:${b.totalPages}, cover:"${b.coverUrl}", pdf:"${b.pdfUrl}" }`);
  }
  await p.$disconnect();
})();