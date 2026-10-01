import { PrismaClient } from "@prisma/client";
async function main() {
const p = new PrismaClient();
const s = await p.storedFile.findMany({
  where: { key: { startsWith: "pdfs/" } },
  select: { key: true, size: true },
});
console.log("stored pdf rows:", s.length);
for (const r of s) console.log(r.key, r.size);
const books = await p.book.findMany({ select: { id: true, title: true, pdfUrl: true } });
console.log("books:", books.length);
for (const b of books) console.log(b.id, "|", b.title, "|", b.pdfUrl);
await p.$disconnect();
}
main();