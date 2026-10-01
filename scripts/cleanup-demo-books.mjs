#!/usr/bin/env node
// ============================================================
// Demo/seed kitoblarni to'liq o'chirish.
// Saqlanadi: faqat REAL PDF bilan import qilingan kitoblar
//   (pdfUrl: "pdfs/hb-..." — handybook.uz, "pdfs/zy-..." — ziyouz.com)
// O'chiriladi: seed book-1..50, book-ali, eski ziyouz/add-100-demo importlari
//   + ularning muqovalari (DB StoredFile va public/covers/*.svg)
//   + diskdagi placeholder PDF'lar.
// Run: node scripts/cleanup-demo-books.mjs
// ============================================================
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// .env ni yukla
if (!process.env.DATABASE_URL) {
  for (const f of [".env", ".env.local"]) {
    const p = path.join(process.cwd(), f);
    if (fs.existsSync(p)) {
      for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
        const m = line.match(/^\s*DATABASE_URL\s*=\s*"?([^"\r\n]+)"?\s*$/);
        if (m) {
          process.env.DATABASE_URL = m[1];
          break;
        }
      }
      if (process.env.DATABASE_URL) break;
    }
  }
}

const ROOT = process.cwd();

function isRealPdf(pdfUrl) {
  if (!pdfUrl) return false;
  return pdfUrl.startsWith("pdfs/hb-") || pdfUrl.startsWith("pdfs/zy-");
}

async function main() {
  const books = await prisma.book.findMany({
    select: { id: true, title: true, pdfUrl: true, coverUrl: true },
  });

  const toDelete = books.filter((b) => !isRealPdf(b.pdfUrl));
  const toKeep = books.filter((b) => isRealPdf(b.pdfUrl));

  console.log(`Kitoblar jami: ${books.length} ta`);
  console.log(`Saqlanadi (real PDF): ${toKeep.length} ta`);
  console.log(`O'chiriladi (demo):   ${toDelete.length} ta\n`);

  if (toDelete.length === 0) {
    console.log("O'chirish uchun demo kitob yo'q.");
    return;
  }

  // 1. DB dagi muqovalar (StoredFile)
  const coverKeys = toDelete
    .map((b) => b.coverUrl)
    .filter((u) => u && u.startsWith("/api/files/"))
    .map((u) => u.replace("/api/files/", ""));
  if (coverKeys.length) {
    const f = await prisma.storedFile.deleteMany({ where: { key: { in: coverKeys } } });
    console.log(`O'chirildi (DB muqova): ${f.count} ta`);
  }

  // 2. Kitoblar (bog'liq progress/ratings/reviews cascade o'chadi)
  const del = await prisma.book.deleteMany({
    where: { id: { in: toDelete.map((b) => b.id) } },
  });
  console.log(`O'chirildi (kitob): ${del.count} ta`);

  // 3. Disk: eski PDF'lar
  let pdfN = 0;
  for (const b of toDelete) {
    if (b.pdfUrl && b.pdfUrl.startsWith("pdfs/")) {
      const full = path.join(ROOT, "storage", "private", b.pdfUrl.replace(/\.\.+/g, ""));
      const realDir = path.join(ROOT, "storage", "private", "pdfs");
      if (full.startsWith(realDir) && fs.existsSync(full)) {
        fs.unlinkSync(full);
        pdfN++;
      }
    }
  }
  console.log(`O'chirildi (disk PDF): ${pdfN} ta`);

  // 4. Disk: demo SVG muqovalar (hb-* real muqovalar saqlanadi; ziyouz real slug muqovalari keyin yaratiladi)
  const coversDir = path.join(ROOT, "public", "covers");
  let svgN = 0;
  for (const b of toDelete) {
    if (b.coverUrl && b.coverUrl.startsWith("/covers/")) {
      const name = path.basename(b.coverUrl);
      if (name.startsWith("hb-")) continue; // real import muqovasi
      const full = path.join(coversDir, name.replace(/\.\.+/g, ""));
      if (full.startsWith(coversDir) && fs.existsSync(full)) {
        fs.unlinkSync(full);
        svgN++;
      }
    }
  }
  console.log(`O'chirildi (disk SVG muqova): ${svgN} ta`);

  // 5. Yetim StoredFile covers (slug emas, random key'lar allaqachon o'chirildi)
  const remain = await prisma.book.count();
  console.log(`\nQoldi: ${remain} ta kitob (barchasi real PDF bilan)`);
  const kept = await prisma.book.findMany({
    where: { OR: [{ pdfUrl: { startsWith: "pdfs/hb-" } }, { pdfUrl: { startsWith: "pdfs/zy-" } }] },
    select: { id: true },
  });
  console.log(`Real import tekshiruvi: ${kept.length} ta hb-/zy- kitob`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
