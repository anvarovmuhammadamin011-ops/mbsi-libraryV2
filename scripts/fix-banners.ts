import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const banners = await p.banner.findMany();
  for (const b of banners) {
    await p.banner.update({
      where: { id: b.id },
      data: { imageUrl: "/api/files/covers/hb-3.jpg" },
    });
  }
  console.log("banners updated:", banners.length);
  await p.$disconnect();
})();