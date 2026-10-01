#!/usr/bin/env node
// Test: extract page images from the Ali PDF (scanned) and OCR page 1
// with the qwen vision model to validate the whole flow.
// Usage: npx tsx scripts/ocr-test.ts
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { PrismaClient } from "@prisma/client";
import { PNG } from "pngjs";

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

  console.log(`Sahifalar soni: ${doc.numPages}`);

  // Test a few early pages to gauge quality + token usage
  for (const pageNum of [1, 2, 3, 5]) {
    const page = await doc.getPage(pageNum);
    const ops = await page.getOperatorList();
    const OPS = pdfjs.OPS;

    let best: { width: number; height: number; buf: Buffer } | null = null;
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      if (fn !== OPS.paintImageXObject && fn !== OPS.paintInlineImageXObject) continue;
      let img = null;
      if (fn === OPS.paintImageXObject) {
        const name = ops.argsArray[i][0];
        img = await page.objs.get(name);
      } else {
        img = ops.argsArray[i][0];
      }
      if (!img || !img.data) continue;
      const rgba = new Uint8Array(img.width * img.height * 4);
      const src = img.data;
      const n = img.width * img.height;
      // 1-bit packed (kind 1): each byte holds 8 pixels, row stride
      // is rowWidth = ceil(width / 8). Bit 1 = white, 0 = black.
      const rowWidth = Math.ceil(img.width / 8);
      const perPx = src.length / n;
      if (perPx <= 0.2) {
        // 1bpp packed
        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const byte = src[y * rowWidth + (x >> 3)];
            const bit = (byte >> (7 - (x & 7))) & 1;
            const v = bit ? 255 : 0;
            const p = y * img.width + x;
            rgba[p * 4] = v;
            rgba[p * 4 + 1] = v;
            rgba[p * 4 + 2] = v;
            rgba[p * 4 + 3] = 255;
          }
        }
      } else {
        const comps = Math.round(src.length / n);
        for (let p = 0; p < n; p++) {
          const r = comps >= 1 ? src[p * comps] : 255;
          const g = comps >= 2 ? src[p * comps + 1] : r;
          const b = comps >= 3 ? src[p * comps + 2] : r;
          rgba[p * 4] = r;
          rgba[p * 4 + 1] = g;
          rgba[p * 4 + 2] = b;
          rgba[p * 4 + 3] = 255;
        }
      }
      const png = new PNG({ width: img.width, height: img.height });
      png.data = Buffer.from(rgba);
      const buf = PNG.sync.write(png);
      if (!best || (img.width * img.height > best.width * best.height)) {
        best = { width: img.width, height: img.height, buf };
      }
    }
    page.cleanup();

    console.log("\n===================================");
    console.log(`Sahifa ${pageNum}: ${best ? `${best.width}x${best.height}, PNG ${best.buf.length} bayt` : "rasm yo'q"}`);
    if (!best) continue;

    const dataUrl = "data:image/png;base64," + best.buf.toString("base64");
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.AI_API_KEY,
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Bu PDF sahifasi. Sahifadagi barcha matnni to'liq chiqarib ber, paragraflarni saqla. Faqat matnni yoz.",
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });
    const d = await res.json();
    if (res.ok) {
      const content: string = d.choices?.[0]?.message?.content ?? "";
      const usage = d.usage || {};
      console.log(`OCR: ${content.length} belgi (in:${usage.prompt_tokens} out:${usage.completion_tokens})`);
      console.log("MATN BOSHI:", content.slice(0, 300));
    } else {
      console.log("OCR XATO:", JSON.stringify(d.error || d).slice(0, 300));
    }
    // Respect OTPM limit (1000/min) - wait between pages
    await new Promise((r) => setTimeout(r, 30000));
  }

  await doc.destroy();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());