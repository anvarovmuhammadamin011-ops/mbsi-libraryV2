import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const b = await p.book.findMany({
    where: {
      OR: [
        { pdfUrl: { contains: "ali" } },
        { title: { contains: "Ali", mode: "insensitive" } },
        { coverUrl: { contains: "ali-kitobi" } },
      ],
    },
    select: { id: true, title: true, pdfUrl: true, coverUrl: true },
  });
  console.log(JSON.stringify(b, null, 2));
  await p.$disconnect();
})();