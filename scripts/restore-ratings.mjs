// Yarim qolgan reytinglarni to'ldirish. Run: node scripts/restore-ratings.mjs
import { PrismaClient } from "@prisma/client";
import { RATINGS } from "../prisma/seed.mjs";

const prisma = new PrismaClient();
async function main() {
  let n = 0;
  for (const r of RATINGS) {
    await prisma.rating.upsert({
      where: { userId_bookId: { userId: r.userId, bookId: r.bookId } },
      create: { userId: r.userId, bookId: r.bookId, rating: r.rating },
      update: {},
    });
    n++;
    if (n % 10 === 0) console.log(`${n}/${RATINGS.length}`);
  }
  console.log(`ratings done: ${n}`);
  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
