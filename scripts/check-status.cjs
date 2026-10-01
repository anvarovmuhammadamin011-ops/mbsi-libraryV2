const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const books = await p.book.findMany({
    select: { id: true, title: true, isPublished: true, status: true, pdfUrl: true, coverUrl: true },
  });
  for (const b of books) {
    console.log(
      `${b.id} | ${b.title} | published=${b.isPublished} | status=${b.status} | pdf=${b.pdfUrl ? "Y" : "N"}`
    );
  }
  await p.$disconnect();
})();