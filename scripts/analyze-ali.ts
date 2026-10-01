#!/usr/bin/env node
// Re-extract text from the "Ali" book PDF, then run AI analysis + translation.
// Usage: npx tsx scripts/analyze-ali.ts
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const book = await prisma.book.findFirst({
    where: { title: { contains: "ali", mode: "insensitive" } },
    include: { content: true },
  });

  if (!book) {
    console.log("Alí kitobi topilmadi");
    return;
  }

  console.log(`Kitob: ${book.title} (${book.id})`);
  console.log(`PDF URL: ${book.pdfUrl}`);
  console.log(`Status: ${book.content?.status ?? "yo'q"}`);

  let text = book.content?.extractedText;

  // If no text yet, extract from the PDF stored in DB
  if (!text || text.length < 50) {
    if (!book.pdfUrl) {
      console.log("PDF URL yo'q!");
      return;
    }
    console.log("PDF'dan matn ajratilmoqda...");
    const storedFile = await prisma.storedFile.findUnique({
      where: { key: book.pdfUrl.replace(/\\/g, "/").replace(/\.\.+/g, "") },
    });
    if (!storedFile) {
      // maybe key differs
      const files = await prisma.storedFile.findMany({ take: 100 });
      const match = files.find((f) => book.pdfUrl!.includes(f.key));
      if (!match) {
        console.log("PDF DB'da topilmadi. Sizda bor fayllar:");
        files.forEach((f) => console.log("  -", f.key));
        return;
      }
      text = await extractFromBuffer(Buffer.from(match.data));
      await saveText(book.id, text);
    } else {
      text = await extractFromBuffer(Buffer.from(storedFile.data));
      await saveText(book.id, text);
    }
  }

  console.log(`Matn: ${text.length} belgi`);

  // 1. AI analysis
  const { analyzeBookContent, extractKeyTerms } = await import("../src/lib/server/book-analysis");
  console.log("AI tahlil boshlanyapti...");
  const [analysis, keyTerms] = await Promise.all([
    analyzeBookContent(text, []),
    extractKeyTerms(text),
  ]);

  console.log("\n--- XULOSA ---");
  console.log(analysis.summary);
  console.log("\n--- KALIT FIKRLAR ---");
  analysis.keyPoints.forEach((p, i) => console.log(`${i + 1}. ${p}`));
  console.log(`\n--- HIGHLIGHTS: ${analysis.highlights.length} ta ---`);
  analysis.highlights.forEach((h, i) => console.log(`${i + 1}. [${h.importance}] ${h.text.slice(0, 80)}`));
  console.log(`\n--- ATAMALAR (${keyTerms.length} ta) ---`);
  console.log(keyTerms.join(", "));

  // 2. Translation
  let translatedText = book.content?.translatedText;
  if (!translatedText) {
    console.log("\nTarjima boshlanyapti...");
    try {
      const { translateToUzbek } = await import("../src/lib/server/translation");
      const translation = await translateToUzbek(text);
      translatedText = translation.translatedText;
      console.log(`Tarjima: ${translatedText.length} belgi`);
    } catch (e) {
      console.error("Tarjima xatosi:", (e as Error).message);
    }
  }

  // 3. Save to DB
  await prisma.bookContent.update({
    where: { bookId: book.id },
    data: {
      summary: analysis.summary,
      keyPoints: analysis.keyPoints,
      highlights: analysis.highlights,
      tableOfContents: analysis.tableOfContents.length ? analysis.tableOfContents : undefined,
      keyTerms,
      ...(translatedText ? { translatedText } : {}),
      status: "completed",
    },
  });

  console.log("\n✅ DB'ga saqlandi!");
}

async function extractFromBuffer(buffer: Buffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: false,
  }).promise;

  const pages: string[] = [];
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
  return pages.join("\n\n");
}

async function saveText(bookId: string, text: string) {
  await prisma.bookContent.upsert({
    where: { bookId },
    create: { bookId, extractedText: text, status: "processing" },
    update: { extractedText: text, status: "processing" },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());