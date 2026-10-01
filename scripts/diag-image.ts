#!/usr/bin/env node
// Diagnose the image object structure in the Ali PDF so we can
// extract pages as proper JPEG/PNG for OCR.
// Usage: npx tsx scripts/diag-image.ts
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

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(storedFile.data),
    isEvalSupported: false,
    useSystemFonts: false,
  }).promise;

  const page = await doc.getPage(5);
  const ops = await page.getOperatorList();
  const OPS = pdfjs.OPS;

  for (let i = 0; i < ops.fnArray.length; i++) {
    if (ops.fnArray[i] !== OPS.paintImageXObject) continue;
    const name = ops.argsArray[i][0];
    const img = await page.objs.get(name);
    console.log("img xususiyatlari:");
    console.log("  width:", img.width, "height:", img.height);
    console.log("  channels:", img.channels, "bpc:", img.bpc);
    console.log("  kind:", img.kind, "colorSpace:", img.colorSpace?.name);
    console.log("  data uzunligi:", img.data?.length);
    console.log("  data dastlabki baytlar:", Array.from(img.data.slice(0, 16)));
    if (img.obj) {
      console.log("  obj.filter:", img.obj.filter);
      console.log("  obj.params:", JSON.stringify(img.obj.params));
      const bytes = await img.obj.getBytes();
      console.log("  obj.getBytes():", bytes.length, "bosh:", Array.from(bytes.slice(0, 16)));
    }
    console.log("  has obj.data:", Boolean(img.obj?.data), "obj.data len:", img.obj?.data?.length);
    // try PDFImage helper
    try {
      const { PDFImage } = pdfjs;
      const pdfImage = await PDFImage.create({ xref: doc.xref, res: page.objs, image: img.obj, diagnostics: {} });
      const _c = pdfImage.getImageBitmap() || pdfImage;
      console.log("  PDFImage drawWidth:", pdfImage.drawWidth, "drawHeight:", pdfImage.drawHeight);
      const raw = pdfImage.image.data;
      console.log("  PDFImage raw data len:", raw?.length);
      if (raw) {
        const n = pdfImage.drawWidth * pdfImage.drawHeight;
        console.log("  PDFImage bytes/px:", (raw.length / n).toFixed(2));
      }
    } catch (e) {
      console.log("  PDFImage xatosi:", (e as Error).message.slice(0, 200));
    }
    break;
  }

  await doc.destroy();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());