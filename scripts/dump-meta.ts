import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const banners = await p.banner.findMany();
  console.log("banners:", banners.length);
  for (const b of banners) console.log(`- ${b.title} | ${b.imageUrl}`);
  const cat2 = await p.category.findUnique({ where: { id: "cat-2" } });
  console.log("cat-2:", cat2?.name);
  const authors = await p.author.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  console.log("authors count:", authors.length);
  for (const a of authors) console.log(`- ${a.id} | ${a.name}`);
  await p.$disconnect();
})();