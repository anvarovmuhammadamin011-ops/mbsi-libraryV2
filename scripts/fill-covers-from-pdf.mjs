// Placeholder (SVG) muqovalarni kitob PDF'ining birinchi bo'sh bo'lmagan
// sahifasidan olingan haqiqiy rasm bilan almashtirish (MuPDF/WASM renderer).
//
// Nima uchun MuPDF: pdfjs Node'da ayrim shriftlarni noto'g'ri chizadi
// (harflar ustma-ust tushadi yoki sahifa bo'sh qoladi), MuPDF esa PDFium
// kabi to'g'ri chizadi.
//
// Run: node scripts/fill-covers-from-pdf.mjs [--limit N] [--pages N] [--refresh] [--dry]
//   --pages N  : 1..N sahifalar orasidan muqova qidiradi (default 6)
//   --refresh  : faqat .svg emas, avval yaratilgan <slug>.jpg muqovalarni ham qayta chizadi
//   --dry      : fayl/DB ga yozmaydi, faqat hisobot beradi
import fs from "node:fs";
import path from "node:path";
import { createCanvas, loadImage } from "canvas";
import * as mupdf from "mupdf";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const COVERS_DIR = path.join(process.cwd(), "public", "covers");
const PRIVATE_DIR = path.join(process.cwd(), "storage", "private");
const TARGET_W = 760;
const QUALITY = 0.85;
const MIN_INK = 0.01;

const argv = process.argv.slice(2);
const LIMIT = argv.includes("--limit") ? Number(argv[argv.indexOf("--limit") + 1]) : Infinity;
const DRY = argv.includes("--dry");
const REFRESH = argv.includes("--refresh");
const MAX_PAGES = argv.includes("--pages") ? Number(argv[argv.indexOf("--pages") + 1]) : 6;

async function inkOf(canvas) {
  const ctx = canvas.getContext("2d");
  const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let nonWhite = 0;
  let sampled = 0;
  for (let i = 0; i < d.length; i += 4 * 37) {
    sampled++;
    if (d[i] < 245 || d[i + 1] < 245 || d[i + 2] < 245) nonWhite++;
  }
  return nonWhite / sampled;
}

// PDF'dan muqova uchun sahifa tanlaydi: 1..MAX_PAGES ichida yetarli siyohi
// bo'lgan birinchi sahifa (bo'sh sahifalar chetlab o'tiladi).
async function renderCover(pdfPath) {
  const doc = mupdf.Document.openDocument(fs.readFileSync(pdfPath), "application/pdf");
  try {
    const numPages = doc.countPages();
    const max = Math.min(MAX_PAGES, numPages);
    let best = null;
    let chosen = null;
    for (let n = 0; n < max; n++) {
      const page = doc.loadPage(n);
      // MuPDF Rect — massiv ko'rinishida [x0, y0, x1, y1]
      const bounds = page.getBounds();
      const pageWidth = bounds[2] !== undefined ? bounds[2] - bounds[0] : bounds.width;
      const scale = Math.max(1, TARGET_W / pageWidth);
      const pix = page.toPixmap(mupdf.Matrix.scale(scale, scale), mupdf.ColorSpace.DeviceRGB, false, false);
      const png = Buffer.from(pix.asPNG());
      pix.destroy();
      const img = await loadImage(png);
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
      const inkRatio = await inkOf(canvas);
      const rec = { inkRatio, pageNo: n + 1 };
      if (!best || rec.inkRatio > best.inkRatio) best = rec;
      if (inkRatio >= MIN_INK) {
        chosen = {
          buf: canvas.toBuffer("image/jpeg", { quality: QUALITY }),
          w: img.width,
          h: img.height,
          inkRatio,
          bytes: -1,
          pageNo: n + 1,
        };
        chosen.bytes = chosen.buf.length;
        break;
      }
    }
    if (!chosen && best && best.inkRatio >= 0.004) chosen = best;
    return chosen;
  } finally {
    doc.destroy();
  }
}

async function main() {
  // --refresh: SVG placeholder'lar + bu skript yaratgan <slug>.jpg muqovalar
  // (handybook muqovalari hb-N.jpg — ular tegmaydi)
  const where = REFRESH
    ? {
        OR: [
          { coverUrl: { endsWith: ".svg" } },
          { coverUrl: { endsWith: ".jpg", not: { startsWith: "/covers/hb-" } } },
        ],
      }
    : { coverUrl: { endsWith: ".svg" } };

  const books = await prisma.book.findMany({
    where,
    select: { id: true, title: true, slug: true, coverUrl: true, pdfUrl: true },
    orderBy: { title: "asc" },
  });
  const targets = books.slice(0, LIMIT);
  console.log(
    `${REFRESH ? "Qayta chizish (SVG + yaratilgan JPG)" : "Placeholder muqovali kitoblar"}: ${books.length}, ishlanadi: ${targets.length}${DRY ? " (DRY RUN)" : ""}`
  );

  let ok = 0;
  let blank = 0;
  let noPdf = 0;
  let failed = 0;
  let i = 0;

  for (const b of targets) {
    i++;
    if (!b.pdfUrl || b.pdfUrl.startsWith("/api/files/")) {
      noPdf++;
      console.log(`[${i}] SKIP (PDF topilmadi): ${b.title}`);
      continue;
    }
    const pdfPath = path.join(PRIVATE_DIR, b.pdfUrl.replace(/\.\.+/g, ""));
    if (!fs.existsSync(pdfPath)) {
      noPdf++;
      console.log(`[${i}] SKIP (fayl yo'q): ${b.title}`);
      continue;
    }

    try {
      const res = await renderCover(pdfPath);
      if (!res || res.inkRatio < MIN_INK) {
        blank++;
        console.log(
          `[${i}] BO'SH sahifalar (1-${MAX_PAGES}, eng yaxshi ink=${res ? (res.inkRatio * 100).toFixed(2) : "0.00"}%): ${b.title}`
        );
        continue;
      }
      const { buf, w, h, inkRatio, bytes, pageNo } = res;
      const file = `${b.slug}.jpg`;
      const outPath = path.join(COVERS_DIR, file);

      if (!DRY) {
        fs.writeFileSync(outPath, buf);
        await prisma.book.update({ where: { id: b.id }, data: { coverUrl: `/covers/${file}` } });
      }
      ok++;
      console.log(
        `[${i}] OK s.${pageNo} ${Math.round(bytes / 1024)}KB ${w}x${h} ink=${(inkRatio * 100).toFixed(1)}%: ${b.title}`
      );
    } catch (e) {
      failed++;
      console.log(`[${i}] XATO: ${b.title} — ${(e && e.message ? e.message : e).toString().slice(0, 140)}`);
    }
  }

  const left = await prisma.book.count({ where: { coverUrl: { endsWith: ".svg" } } });
  console.log(`\nYakunlandi: yangilandi=${ok} bo'sh=${blank} PDF yo'q=${noPdf} xato=${failed}`);
  console.log(`Qolgan placeholder: ${left}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
