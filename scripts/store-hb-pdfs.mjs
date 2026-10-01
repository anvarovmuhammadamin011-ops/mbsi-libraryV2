import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ROOT = process.cwd();
const PRIVATE = path.join(ROOT, "storage", "private");

// Har bir kitobning pdfUrl key'i (masalan: pdfs/hb-1-alkimyogar.pdf).
// Fayl diskda `storage/private/<key>` bo'lsa — baytlarini DB StoredFile'ga yozamiz.
// Shunda Vercel (storage/** tracing'dan chiqarilgan) readPrivate orqali DB'dan o'qiydi.
const books = await prisma.book.findMany({
  where: { pdfUrl: { startsWith: "pdfs/" } },
  select: { id: true, title: true, pdfUrl: true },
});

let ok = 0;
let skipped = 0;
let failed = 0;

for (const b of books) {
  const rel = b.pdfUrl.replace(/^pdfs\//, "");
  const fp = path.join(PRIVATE, "pdfs", rel);
  if (!fs.existsSync(fp)) {
    console.log(`MISS  ${b.id} | ${b.title} | ${fp}`);
    failed++;
    continue;
  }
  const data = fs.readFileSync(fp);
  if (data.slice(0, 5).toString("latin1") !== "%PDF-") {
    console.log(`NOT-PDF ${b.id} | ${b.title} | ${data.length}b`);
    failed++;
    continue;
  }
  await prisma.storedFile.upsert({
    where: { key: b.pdfUrl },
    update: { mime: "application/pdf", size: data.length, data: new Uint8Array(data) },
    create: { key: b.pdfUrl, mime: "application/pdf", size: data.length, data: new Uint8Array(data) },
  });
  console.log(`OK    ${b.id} | ${b.title} | ${Math.round(data.length / 1024)}KB | key=${b.pdfUrl}`);
  ok++;
  skipped++;
}

console.log(`\nDone: ${ok} stored, ${failed} failed, skipped used as counter ${skipped}`);
await prisma.$disconnect();