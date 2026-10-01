#!/usr/bin/env node
// Extract text from PDFs for all books without content.
// Usage: node scripts/extract-ali.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find the "ali" book and any other books without content
  const books = await prisma.book.findMany({
    where: {
      pdfUrl: { not: null },
      OR: [
        { title: { contains: "ali", mode: "insensitive" } },
        { content: { is: null } },
      ],
    },
    include: {
      content: { select: { status: true, extractedText: true } },
    },
    take: 50,
  });

  console.log(`Topilgan: ${books.length} kitob`);
  
  for (const book of books) {
    console.log(`\n📖 ${book.title}`);
    console.log(`  PDF: ${book.pdfUrl ? "bor" : "yo'q"}`);
    console.log(`  Content: ${book.content ? book.content.status : "yo'q"}`);
    if (book.content?.extractedText) {
      console.log(`  Matn: ${book.content.extractedText.length} belgi`);
      continue;
    }

    if (!book.pdfUrl) continue;
    console.log("  Matn ajratilmoqda...");

    try {
      // Read PDF from DB
      const storedFile = await prisma.storedFile.findUnique({
        where: { key: book.pdfUrl.replace(/\\/g, "/").replace(/\.\.+/g, "") },
      });
      if (!storedFile) {
        console.log("  ❌ PDF DB'da topilmadi");
        continue;
      }

      const buffer = Buffer.from(storedFile.data);

      // Extract text using pdfjs
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const doc = await pdfjs.getDocument({
        data: new Uint8Array(buffer),
        isEvalSupported: false,
        useSystemFonts: false,
      }).promise;

      const pages = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const text = content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        pages.push(text);
        page.cleanup();
      }
      await doc.destroy();

      const fullText = pages.join("\n\n");

      // Upsert BookContent
      await prisma.bookContent.upsert({
        where: { bookId: book.id },
        create: {
          bookId: book.id,
          extractedText: fullText,
          status: "completed",
        },
        update: {
          extractedText: fullText,
          status: "completed",
        },
      });

      console.log(`  ✅ ${fullText.length} belgi ajratildi`);
    } catch (err) {
      console.error(`  ❌ Xato: ${err.message}`);
      await prisma.bookContent.upsert({
        where: { bookId: book.id },
        create: {
          bookId: book.id,
          status: "error",
          errorMessage: err.message,
        },
        update: {
          status: "error",
          errorMessage: err.message,
        },
      });
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
