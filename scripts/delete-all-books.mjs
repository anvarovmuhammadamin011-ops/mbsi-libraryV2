// BARCHA kitoblarni ilovadan to'liq o'chirish.
// - Book yozuvlari (bog'liq progress/sessiya/reytinglar cascade o'chadi)
// - DB dagi muqovalar (StoredFile covers/*)
// - Import qilingan PDF'lar + yasalgan SVG muqovalar (disk)
// Saqlanadi: mualliflar, kategoriyalar, foydalanuvchilar, repo assetlari (ali-kitobi.pdf, book-*.svg)
// Run: node scripts/delete-all-books.mjs
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const books = await prisma.book.findMany({
    select: { id: true, title: true, slug: true, pdfUrl: true, coverUrl: true },
  });
  console.log(`Kitoblar: ${books.length} ta`);

  // 1. DB dagi muqovalarni yig'ish
  const coverKeys = books
    .map((b) => b.coverUrl)
    .filter((u) => u && u.startsWith("/api/files/"))
    .map((u) => u.replace("/api/files/", ""));

  // 2. Kitoblarni o'chirish (bog'liq yozuvlar cascade)
  const del = await prisma.book.deleteMany({});
  console.log(`O'chirildi (DB): ${del.count} ta kitob`);

  // 3. Yetim qolgan muqovalar
  if (coverKeys.length) {
    const f = await prisma.storedFile.deleteMany({ where: { key: { in: coverKeys } } });
    console.log(`O'chirildi (muqova): ${f.count} ta`);
  }

  // 4. Disk: import qilingan PDF'lar (ali-kitobi.pdf — repo asseti, saqlanadi)
  const pdfDir = path.join(process.cwd(), "storage", "private", "pdfs");
  let pdfN = 0;
  for (const b of books) {
    if (b.pdfUrl && b.pdfUrl.startsWith("pdfs/") && b.pdfUrl !== "pdfs/ali-kitobi.pdf") {
      const full = path.join(process.cwd(), "storage", "private", b.pdfUrl.replace(/\.\.+/g, ""));
      if (full.startsWith(pdfDir) && fs.existsSync(full)) {
        fs.unlinkSync(full);
        pdfN++;
      }
    }
  }
  console.log(`O'chirildi (PDF): ${pdfN} ta`);

  // 5. Disk: yasalgan SVG muqovalar (book-imp sluglar)
  const coversDir = path.join(process.cwd(), "public", "covers");
  let svgN = 0;
  for (const b of books) {
    if (b.coverUrl && b.coverUrl.startsWith("/covers/")) {
      const full = path.join(process.cwd(), b.coverUrl.replace(/^\//, "").replace(/\.\.+/g, ""));
      if (full.startsWith(coversDir) && fs.existsSync(full) && !/^book-\d+\.svg$/.test(path.basename(full))) {
        fs.unlinkSync(full);
        svgN++;
      }
    }
  }
  console.log(`O'chirildi (SVG): ${svgN} ta`);

  console.log(`Qoldi: ${await prisma.book.count()} ta kitob`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
