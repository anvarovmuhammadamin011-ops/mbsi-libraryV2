#!/usr/bin/env node
// Regenerate all placeholder PDFs with a structurally valid PDF generator.
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

/** Generate a minimal but structurally valid single-page PDF. */
function makePdf(title, author, description) {
  const esc = s => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const lines = [
    title,
    "",
    `Muallif: ${author}`,
    description ? esc(description.slice(0, 200)) : "",
    "",
    "Bu kitob MBSI Library kutubxonasi uchun yaratilgan placeholder nashr.",
    "Asl kitobni ziyouz.com saytidan yuklab olish mumkin.",
    "",
    "--- Sahifa 1 ---",
  ];
  const contentLines = lines.map((l, i) =>
    `BT /F1 14 Tf 72 ${680 - i * 22} Td (${esc(l)}) Tj ET`
  );
  contentLines.unshift("0.5 0.5 0.5 RG 50 50 512 742 re S");

  const contentStream = contentLines.join("\n");

  let pdf = "%PDF-1.4\n";
  const offsets = [];

  // obj 1: Catalog
  offsets.push(pdf.length);
  pdf += "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n\n";

  // obj 2: Pages
  offsets.push(pdf.length);
  pdf += "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n\n";

  // obj 3: Page
  offsets.push(pdf.length);
  pdf += "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n\n";

  // obj 4: Content stream
  offsets.push(pdf.length);
  pdf += `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n\n`;

  // obj 5: Font
  offsets.push(pdf.length);
  pdf += "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n\n";

  const xrefOffset = pdf.length;
  const total = 6;
  pdf += `xref\n0 ${total}\n`;
  pdf += "0000000000 65535 f \n";
  for (const off of offsets) {
    pdf += String(off).padStart(10, "0") + " 00000 n \n";
  }
  pdf += `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

async function main() {
  const root = process.cwd();
  const books = await prisma.book.findMany({
    include: { author: true },
  });

  let regenerated = 0;

  for (const b of books) {
    if (!b.pdfUrl) continue;
    const fp = path.join(root, "storage", "private", b.pdfUrl);
    fs.mkdirSync(path.dirname(fp), { recursive: true });

    const authorName = b.author?.name || "Noma'lum muallif";
    const buf = makePdf(b.title, authorName, b.description || "");
    fs.writeFileSync(fp, buf);
    regenerated++;

    if (regenerated % 25 === 0) console.log(`  📄 ${regenerated} ta qayta yaratildi...`);
  }

  console.log(`\n✅ Tugadi! ${regenerated} ta PDF qayta yaratildi.`);

  // Verify
  let ok = 0, fail = 0;
  for (const b of books) {
    if (!b.pdfUrl) continue;
    const fp = path.join(root, "storage", "private", b.pdfUrl);
    if (fs.existsSync(fp) && fs.readFileSync(fp).slice(0, 5).toString("ascii") === "%PDF-") ok++;
    else fail++;
  }
  console.log(`   Tekshirish: ${ok} ta to'g'ri PDF, ${fail} ta xato`);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
