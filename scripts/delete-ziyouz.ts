import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const targets = await p.book.findMany({
    where: { pdfUrl: null },
    select: { id: true, title: true },
  });
  console.log("ziyouz books to delete:", targets.length);
  for (const b of targets.slice(0, 5)) console.log(`- ${b.id} | ${b.title}`);
  const del = await p.book.deleteMany({ where: { pdfUrl: null } });
  console.log("deleted:", del.count);
  const remaining = await p.book.count();
  const withPdf = await p.book.count({ where: { pdfUrl: { not: null } } });
  console.log("remaining total:", remaining, "withPdf:", withPdf);
  await p.$disconnect();
})();