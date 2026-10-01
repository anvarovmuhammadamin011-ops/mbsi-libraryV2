import { PrismaClient } from "@prisma/client";
import { extractTextFromPdf } from "../src/lib/server/text-extraction";

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

  console.log("Starting extraction with OCR fallback (first 5 pages for testing)...");

  const extraction = await extractTextFromPdf(book.pdfUrl!, { limitPages: 5 });

  console.log(`\nExtraction complete!`);
  console.log(`Total pages: ${extraction.totalPages}`);
  console.log(`Text length: ${extraction.fullText.length} chars`);

  // Show first 1000 chars
  console.log(`\nFirst 1000 chars of extracted text:`);
  console.log(extraction.fullText.substring(0, 1000));

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
