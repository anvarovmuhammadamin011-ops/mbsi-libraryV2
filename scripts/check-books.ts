import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const all = await prisma.book.findMany({
    select: { id: true, title: true, pdfUrl: true, coverUrl: true },
  });
  console.log(`total books: ${all.length}`);
  const groups: Record<string, number> = {};
  for (const b of all) {
    const key = b.pdfUrl
      ? (b.pdfUrl.startsWith("pdfs/hb-") ? "hb-(handybook)" : b.pdfUrl.startsWith("pdfs/zy-") ? "zy-(ziyouz)" : b.pdfUrl.startsWith("pdfs/book-") ? "seed-pdfs/book-" : "other")
      : "none";
    groups[key] = (groups[key] ?? 0) + 1;
  }
  console.log(JSON.stringify(groups, null, 2));
  const published = all.filter((b) => b.coverUrl?.startsWith("/api/files/")).length;
  console.log(`published (cover stored in DB): ${published}`);
  for (const b of all.slice(0, 15)) {
    console.log(`- ${b.id} | ${b.title} | ${b.pdfUrl} | ${b.coverUrl}`);
  }
  console.log("--- full list (id | title | pdfUrl | coverUrl) ---");
  for (const b of all) {
    console.log(`${b.id} | ${b.title} | ${b.pdfUrl ?? "-"} | ${b.coverUrl}`);
  }
}
main().finally(() => prisma.$disconnect());