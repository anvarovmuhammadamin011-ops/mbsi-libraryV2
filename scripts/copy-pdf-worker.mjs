// postinstall: pdfjs-dist worker faylini public/ ga nusxalaydi.
// Reader "/pdf-worker/pdf.worker.min.mjs" manzilidan foydalanadi.
import { copyFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const src = join(process.cwd(), "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const outDir = join(process.cwd(), "public", "pdf-worker");
const dest = join(outDir, "pdf.worker.min.mjs");

try {
  if (!existsSync(src)) {
    console.warn("[copy-pdf-worker] pdfjs-dist worker topilmadi, o'tkazib yuborildi");
    process.exit(0);
  }
  // Agar nusxa allaqachon mavjud va bir xil hajmda bo'lsa — qayta yozmaymiz
  if (existsSync(dest) && statSync(dest).size === statSync(src).size) {
    process.exit(0);
  }
  mkdirSync(outDir, { recursive: true });
  copyFileSync(src, dest);
  console.log("[copy-pdf-worker] pdf.worker.min.mjs → public/pdf-worker/ nusxalandi");
} catch (err) {
  console.warn("[copy-pdf-worker] nusxalash xatosi (davom etamiz):", err?.message ?? err);
}
