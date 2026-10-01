// Quick script: re-extract text for a specific book using OCR fallback
// Run with: node scripts/re-extract.mjs

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const book = await prisma.book.findFirst({ where: { slug: "ali" } });
  if (!book) {
    console.error("Book 'ali' not found");
    process.exit(1);
  }

  console.log(`Found book: ${book.title} (${book.id})`);
  console.log(`PDF key: ${book.pdfUrl}`);

  // Set status to processing
  await prisma.bookContent.upsert({
    where: { bookId: book.id },
    create: { bookId: book.id, status: "processing" },
    update: { status: "processing" },
  });

  console.log("Starting extraction with OCR fallback...");

  const { extractTextFromPdf } = await import(
    "../src/lib/server/text-extraction.ts"
  );
  const extraction = await extractTextFromPdf(book.pdfUrl!);

  console.log(`\nExtraction complete!`);
  console.log(`Total pages: ${extraction.totalPages}`);
  console.log(`Text length: ${extraction.fullText.length} chars`);

  // Show first 500 chars of extracted text
  console.log(`\nFirst 500 chars of extracted text:`);
  console.log(extraction.fullText.substring(0, 500));

  // Show sample from page 3
  if (extraction.pages.length >= 3) {
    console.log(`\n--- Page 3 sample (first 300 chars) ---`);
    console.log(extraction.pages[2].text.substring(0, 300));
  }

  // Save to database
  await prisma.bookContent.update({
    where: { bookId: book.id },
    data: {
      extractedText: extraction.fullText,
      status: "completed",
    },
  });

  console.log("\nSaved to database!");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
