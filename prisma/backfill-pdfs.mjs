import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const ROOT = process.cwd();
const PRIVATE = path.join(ROOT, "storage", "private", "pdfs");
fs.mkdirSync(PRIVATE, { recursive: true });

const src = "c:\\temp\\sample.pdf";
if (!fs.existsSync(src)) {
  console.error("sample pdf missing");
  process.exit(1);
}

const books = await prisma.book.findMany();
for (const b of books) {
  const dest = path.join(PRIVATE, b.id + ".pdf");
  fs.copyFileSync(src, dest);
  const size = fs.statSync(dest).size;
  await prisma.book.update({
    where: { id: b.id },
    data: { pdfUrl: `pdfs/${b.id}.pdf`, fileSize: size },
  });
}
console.log(`backfilled ${books.length} books`);
await prisma.$disconnect();
