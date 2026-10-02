import { PrismaClient } from "@prisma/client";
import { unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const ROOT = "C:/Users/Victus/Desktop/MBSI library/mbsi-library";
const SLUGS = ["c", "kitob"];

const books = await prisma.book.findMany({
  where: { slug: { in: SLUGS } },
  select: { id: true, title: true, slug: true, pdfUrl: true, coverUrl: true,
    _count: { select: { progress: true, reviews: true, ratings: true, favorites: true, bookmarks: true } } },
});

for (const b of books) {
  const c = b._count;
  const anyDep = Object.values(c).some((n) => n > 0);
  console.log(`\n"${b.title}" (${b.slug}) — bog'liqliklar: ${JSON.stringify(c)}${anyDep ? "  DIQQAT!" : " (toza)"}`);
  if (anyDep) { console.log("  SKIP: bog'liqlik bor"); continue; }

  await prisma.book.delete({ where: { id: b.id } });
  console.log("  [1] DB o'chirildi");

  const pdfName = path.basename(b.pdfUrl || "");
  const pdfPath = path.join(ROOT, "storage", "private", "pdfs", pdfName);
  if (pdfName && existsSync(pdfPath)) { await unlink(pdfPath); console.log(`  [2] PDF: ${pdfName}`); }

  const coverName = path.basename(b.coverUrl || "");
  const coverPath = path.join(ROOT, "public", "covers", coverName);
  if (coverName && existsSync(coverPath)) { await unlink(coverPath); console.log(`  [3] Cover: ${coverName}`); }
  else console.log(`  [3] Cover topilmadi (${coverName})`);
}

// Natija: qisqa slug qoldimi?
const left = await prisma.book.findMany({ where: { slug: { in: SLUGS } }, select: { slug: true } });
const stillShort = await prisma.book.count({ where: { slug: { lte: "ccccc" } } });
console.log(`\nNatija: kitob=${await prisma.book.count()} | o'chirilmagan=${left.length} | qisqa slug qoldi=${stillShort}`);
await prisma.$disconnect();