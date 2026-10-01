#!/usr/bin/env node
// Inspect the Ali PDF structure: count images per page, sizes,
// non-white pixel ratio, and text layer beyond the watermark.
// Usage: npx tsx scripts/inspect-ali.ts
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const book = await prisma.book.findFirst({
    where: { title: { contains: "ali", mode: "insensitive" } },
  });
  if (!book?.pdfUrl) throw new Error("Ali kitobi/PDF topilmadi");

  const storedFile = await prisma.storedFile.findUnique({
    where: { key: book.pdfUrl.replace(/\\/g, "/").replace(/\.\.+/g, "") },
  });
  if (!storedFile) throw new Error("PDF DB'da topilmadi");
  console.log(`PDF fayl: ${book.pdfUrl}, ${storedFile.data.length} bayt`);

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(storedFile.data),
    isEvalSupported: false,
    useSystemFonts: false,
  }).promise;

  console.log(`Sahifalar soni: ${doc.numPages}\n`);
  const OPS = pdfjs.OPS;

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const ops = await page.getOperatorList();

    let textLen = 0;
    let imageCount = 0;
    let largest = { w: 0, h: 0, bytes: 0 };

    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      if (fn === OPS.showText) {
        const args = ops.argsArray[i];
        for (const item of args || []) {
          if (Array.isArray(item)) {
            for (const t of item) {
              if (typeof t === "object" && t && "str" in t) textLen += t.str.length;
            }
          } else if (typeof item === "string") textLen += item.length;
        }
      } else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
        let img = null;
        if (fn === OPS.paintImageXObject) {
          const name = ops.argsArray[i][0];
          img = await page.objs.get(name);
        } else {
          img = ops.argsArray[i][0];
        }
        imageCount++;
        if (img && img.width * img.height > largest.w * largest.h) {
          largest = { w: img.width, h: img.height, bytes: img.data?.length || 0 };
        }
      }
    }
    page.cleanup();
    console.log(`Sahifa ${pageNum.toString().padStart(3)}: matn=${textLen} belgi, rasmlar=${imageCount}, kattaRasm=${largest.w}x${largest.h} (${(largest.bytes / 1024).toFixed(0)}KB)`);
  }

  await doc.destroy();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());