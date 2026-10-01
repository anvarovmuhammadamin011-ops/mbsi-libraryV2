#!/usr/bin/env node
// ============================================================
// Real kitoblar sifat tekshiruvi:
//  - PDF fayli diskda mavjud va %PDF header bilan boshlanadi
//  - Muqova mavjud (StoredFile yoki public/covers/*.svg)
//  - Kategoriya/muallif bog'langan, totalPages > 0
// Run: node scripts/verify-real-books.mjs
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

async function main() {
  const books = await prisma.book.findMany({
    include: { author: true, category: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Jami kitoblar: ${books.length}\n`);

  const problems = [];
  let okPdf = 0;
  let okCover = 0;
  let okPages = 0;
  let okLinks = 0;

  for (const b of books) {
    // 1. PDF tekshiruvi
    let pdfOk = false;
    let pdfSize = 0;
    if (b.pdfUrl && b.pdfUrl.startsWith("pdfs/")) {
      const full = path.join(ROOT, "storage", "private", b.pdfUrl);
      if (fs.existsSync(full)) {
        const fd = fs.openSync(full, "r");
        const hdr = Buffer.alloc(5);
        fs.readSync(fd, hdr, 0, 5, 0);
        fs.closeSync(fd);
        if (hdr.toString("latin1") === "%PDF-") {
          pdfOk = true;
          pdfSize = fs.statSync(full).size;
        }
      }
    } else if (b.pdfUrl && /^https?:/.test(b.pdfUrl)) {
      pdfOk = true; // tashqi URL
    }
    if (pdfOk) okPdf++;
    else problems.push(`PDF YO'Q: ${b.title} (${b.pdfUrl})`);

    // 2. Muqova tekshiruvi
    let coverOk = false;
    if (b.coverUrl && b.coverUrl.startsWith("/api/files/")) {
      const key = b.coverUrl.replace("/api/files/", "");
      const row = await prisma.storedFile.findUnique({ where: { key } });
      coverOk = Boolean(row);
    } else if (b.coverUrl && b.coverUrl.startsWith("/covers/")) {
      coverOk = fs.existsSync(path.join(ROOT, "public", b.coverUrl.replace(/^\//, "")));
    } else if (b.coverUrl && /^https?:/.test(b.coverUrl)) {
      coverOk = true;
    }
    if (coverOk) okCover++;
    else problems.push(`MUQOVA YO'Q: ${b.title} (${b.coverUrl})`);

    // 3. Sahifalar
    if (b.totalPages > 0) okPages++;
    else problems.push(`SAHIFA 0: ${b.title}`);

    // 4. Bog'lanishlar
    if (b.author && b.category) okLinks++;
    else problems.push(`BOG'LANISH YO'Q: ${b.title} (author=${b.author?.name ?? "—"}, cat=${b.category?.name ?? "—"})`);

    console.log(
      `${String(pdfOk ? "OK" : "!!").padEnd(2)} ${b.title.slice(0, 55).padEnd(55)} ${b.author?.name?.slice(0, 30).padEnd(30) ?? "-"} ${(pdfSize / 1024 / 1024).toFixed(1)}MB ${b.totalPages}b ${b.category?.slug ?? "-"}`
    );
  }

  console.log(`\n=== XULOSA ===`);
  console.log(`PDF to'g'ri:   ${okPdf}/${books.length}`);
  console.log(`Muqova to'g'ri:${okCover}/${books.length}`);
  console.log(`Sahifa > 0:    ${okPages}/${books.length}`);
  console.log(`Bog'lanishlar: ${okLinks}/${books.length}`);

  if (problems.length) {
    console.log(`\nMUAMMOLAR (${problems.length}):`);
    for (const p of problems) console.log(`  ! ${p}`);
  } else {
    console.log(`\nBarcha kitoblar to'liq tayyor!`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
