import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const withPdf = await p.book.findMany({
    where: { pdfUrl: { not: null } },
    select: { id: true, title: true, pdfUrl: true, coverUrl: true },
  });
  console.log("books with pdf:", withPdf.length);
  for (const b of withPdf) {
    console.log(`- ${b.id} | ${b.title} | cover=${b.coverUrl}`);
  }
  const covers = await p.storedFile.findMany({
    where: { key: { startsWith: "covers/" } },
    select: { key: true, mime: true, size: true },
  });
  console.log("stored files with covers/ prefix:", covers.length);
  for (const c of covers) console.log(`- ${c.key} | ${c.mime} | ${c.size} bytes`);
  await p.$disconnect();
})();