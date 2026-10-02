import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";
const prisma = new PrismaClient();

const SLUGS = ["c", "kitob"];
const rows = await prisma.book.findMany({
  where: { slug: { in: SLUGS } },
  select: { id: true, title: true, slug: true, pdfUrl: true, coverUrl: true, totalPages: true },
});
console.log(`O'chiriladigan kitoblar: ${rows.length}`);
rows.forEach((b) => console.log(`  ${b.slug.padEnd(7)} ${b.title} (${b.totalPages} sahifa)\n    pdf=${b.pdfUrl}\n    cover=${b.coverUrl}`));

writeFileSync(
  "C:/Users/Victus/AppData/Local/Temp/opencode/removed-short-slug-books.json",
  JSON.stringify(rows, null, 2)
);
console.log("\nBackup: removed-short-slug-books.json");
await prisma.$disconnect();