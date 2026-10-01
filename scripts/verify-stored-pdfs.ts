import { readPrivate } from "../src/lib/server/storage.ts";

// readPrivate tartibi: disk -> S3 -> DB StoredFile.
// Test: pdfUrl key'i bo'yicha o'qib, PDF magic bytes borligini tekshiramiz.
const keys = [
  "pdfs/hb-1-alkimyogar.pdf",
  "pdfs/hb-5-jinoyat-va-jazo.pdf",
  "pdfs/hb-18-war-and-peace.pdf",
];
for (const k of keys) {
  try {
    const buf = await readPrivate(k);
    const magic = buf.slice(0, 5).toString("latin1");
    console.log(`${k} -> ${buf.length} bytes, magic=${magic} ${magic === "%PDF-" ? "OK" : "BAD"}`);
  } catch (e) {
    console.log(`${k} -> ERROR: ${(e as Error).message}`);
  }
}