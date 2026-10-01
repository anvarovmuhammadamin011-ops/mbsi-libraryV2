#!/usr/bin/env node
// Full OCR of the Ali PDF (144 pages) using the qwen vision model.
// Saves per-page text to scripts/cache/ali-ocr.json (resumable).
// Usage:
//   npx tsx scripts/ocr-ali.ts --from 1 --to 20
//   npx tsx scripts/ocr-ali.ts --resume
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { PrismaClient } from "@prisma/client";
import { PNG } from "pngjs";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const arg = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? Number(args[i + 1]) : undefined;
};
const FROM = arg("--from") ?? 1;
const TO = arg("--to") ?? 144;
const RESUME = args.includes("--resume");

const CACHE_FILE = path.join(import.meta.dirname, "cache", "ali-ocr.json");
const MODEL = "qwen/qwen3.8-27b";
const MAX_OUTPUT = 1000;

function loadCache(): Record<number, string> {
  if (!fs.existsSync(CACHE_FILE)) return {};
  return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
}

function saveCache(cache: Record<number, string>) {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 0));
}

type PdfImage = { data: Uint8Array; width: number; height: number };

function decodeImage(img: PdfImage): { png: PNG; width: number; height: number } {
  const { width, height, data } = img;
  const n = width * height;
  const rgba = new Uint8Array(n * 4);
  const perPx = data.length / n;

  if (perPx <= 0.2) {
    const rowWidth = Math.ceil(width / 8);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const byte = data[y * rowWidth + (x >> 3)];
        const bit = (byte >> (7 - (x & 7))) & 1;
        const v = bit ? 255 : 0;
        const p = y * width + x;
        rgba[p * 4] = v;
        rgba[p * 4 + 1] = v;
        rgba[p * 4 + 2] = v;
        rgba[p * 4 + 3] = 255;
      }
    }
  } else {
    const comps = Math.round(data.length / n);
    for (let p = 0; p < n; p++) {
      const r = comps >= 1 ? data[p * comps] : 255;
      const g = comps >= 2 ? data[p * comps + 1] : r;
      const b = comps >= 3 ? data[p * comps + 2] : r;
      rgba[p * 4] = r;
      rgba[p * 4 + 1] = g;
      rgba[p * 4 + 2] = b;
      rgba[p * 4 + 3] = 255;
    }
  }
  const png = new PNG({ width, height });
  png.data = Buffer.from(rgba);
  return { png, width, height };
}

function pngDataUrl(png: PNG): string {
  return "data:image/png;base64," + PNG.sync.write(png).toString("base64");
}

// Crop a PNG region into a new PNG
function cropPng(png: PNG, x0: number, y0: number, w: number, h: number): PNG {
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = ((y0 + y) * png.width + (x0 + x)) * 4;
      const di = (y * w + x) * 4;
      for (let c = 0; c < 4; c++) out.data[di + c] = png.data[si + c];
    }
  }
  return out;
}

const OTPM_LIMIT = 1000;
const WINDOW_MS = 60_000;
let usedTokens: { t: number; at: number }[] = [];

function activeTokens(now: number): number {
  const cutoff = now - WINDOW_MS;
  return usedTokens.filter((u) => u.at > cutoff).reduce((s, u) => s + u.t, 0);
}

async function waitForBudget(): Promise<void> {
  for (;;) {
    const now = Date.now();
    const active = activeTokens(now);
    const oldest = usedTokens.find((u) => u.at > now - WINDOW_MS);
    if (active + 600 <= OTPM_LIMIT) return;
    const waitMs = oldest ? oldest.at + WINDOW_MS - now + 1000 : 30_000;
    console.log(`   [limit] ${active} token aktiv, ${Math.round(waitMs / 1000)}s kutish...`);
    await new Promise((r) => setTimeout(r, waitMs));
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ocrPage(dataUrl: string): Promise<{ text: string; out: number; error?: string; truncated?: boolean }> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.AI_API_KEY },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        max_tokens: MAX_OUTPUT,
        temperature: 0.1,
      }),
    });
    const d = await res.json();
    if (res.ok) {
      const out = d.usage?.completion_tokens ?? 0;
      usedTokens.push({ t: out, at: Date.now() });
      const truncated = d.choices?.[0]?.finish_reason === "length";
      return { text: (d.choices?.[0]?.message?.content ?? "").trim(), out, truncated };
    }
    const errMsg: string = d.error?.message ?? "";
    if (res.status === 429 || /rate limit/i.test(errMsg)) {
      if (attempt === 0) console.log(`   [429] ${errMsg.slice(0, 180)}`);
      await sleep(75_000);
      continue;
    }
    if (/Request too large|expected output/i.test(errMsg)) {
      return { text: "", out: 0, error: errMsg };
    }
    throw new Error(`Sahifa OCR xatosi (${res.status}): ${errMsg.slice(0, 300)}`);
  }
  throw new Error("6 urinishdan keyin ham 429");
}

const prompt =
  "Bu PDF sahifasi (o'zbek kitob). Sahifadagi barcha matnni to'liq, xatosiz chiqarib ber. Paragraflar va qatorlarni saqla. Sahifa raqamlarini va footer/header watermarklarni chiqarma. Faqat matnni yoz.";

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

  let cache = loadCache();
  let done = 0;

  for (let p = FROM; p <= Math.min(TO, doc.numPages); p++) {
    if (RESUME && cache[p]) {
      done++;
      continue;
    }
    console.log(`Sahifa ${p}/${doc.numPages} — ishlamoqda...`);
    const page = await doc.getPage(p);
    const ops = await page.getOperatorList();
    const OPS = pdfjs.OPS;

    let img: PdfImage | null = null;
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      if (fn === OPS.paintImageXObject) {
        const name = ops.argsArray[i][0];
        img = await page.objs.get(name);
      } else if (fn === OPS.paintInlineImageXObject) {
        img = ops.argsArray[i][0];
      }
      if (img && img.data?.length) break;
    }
    page.cleanup();
    if (!img) {
      console.log("   rasm topilmadi, bo'sh");
      saveCache({ ...cache, [p]: "" });
      continue;
    }

    const { png } = decodeImage(img);
    let result: { text: string; out: number; error?: string; truncated?: boolean };
    try {
      await waitForBudget();
      result = await ocrPage(pngDataUrl(png));
    } catch (e: unknown) {
      const msg = (e as Error).message ?? String(e);
      if (msg.startsWith("Sahifa OCR xatosi") && /Request too large|expected output/i.test(msg)) {
        result = { text: "", out: 0, error: "too_large" };
      } else {
        console.error(`   [xato] ${p}-sahifa:`, msg);
        console.error("   Bu sahifa keyingi urinishga qoldiriladi.");
        usedTokens = usedTokens.filter((u) => u.at < Date.now() - 30_000);
        continue;
      }
    }

    // Dense page: split into halves if request is too large or truncated
    if ((!result.text && result.error === "too_large") || result.truncated) {
      console.log(`   zich sahifa${result.truncated ? " (kesildi)" : ""} — yarmiga bo'linmoqda`);
      const top = cropPng(png, 0, 0, png.width, Math.floor(png.height / 2));
      const bot = cropPng(png, 0, Math.floor(png.height / 2), png.width, png.height - Math.floor(png.height / 2));
      let full = "";
      for (const half of [top, bot]) {
        try {
          await waitForBudget();
          const r = await ocrPage(pngDataUrl(half));
          if (!r.text || r.truncated) {
            // quarter split
            const a = cropPng(half, 0, 0, half.width, Math.floor(half.height / 2));
            const b = cropPng(half, 0, Math.floor(half.height / 2), half.width, half.height - Math.floor(half.height / 2));
            let part = "";
            for (const q of [a, b]) {
              try {
                await waitForBudget();
                const rq = await ocrPage(pngDataUrl(q));
                part += (rq.text ? rq.text + "\n" : "");
              } catch (qq: unknown) {
                console.error("   [qism xato]", (qq as Error).message.slice(0, 120));
              }
            }
            full += part + "\n";
          } else {
            full += r.text + "\n";
          }
        } catch (hh: unknown) {
          console.error("   [yarm xato]", (hh as Error).message.slice(0, 120));
        }
      }
      result = { text: full.trim(), out: 0 };
    }

    if (!result.text) {
      console.log("   bo'sh natija");
      saveCache({ ...cache, [p]: "" });
      continue;
    }

    cache = { ...cache, [p]: result.text };
    saveCache(cache);
    done++;
    console.log(`   ✓ ${result.text.length} belgi (out:${result.out})`);
  }

  console.log(`\nYakunlandi. Yangi: ${done} sahifa. Jami keshlangan: ${Object.keys(cache).length}/${doc.numPages}`);
  await doc.destroy();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());