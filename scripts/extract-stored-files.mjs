#!/usr/bin/env node
// stored_files (Postgres BYTEA) ichidagi fayllarni diska ko'chiradi,
// so'ng jadvaldan o'chiradi. Neon 512MB limiti to'lganligi uchun
// shu yerda saqlangan PDF'lar ko'payishga imkon bermayapti.
//
// Run: node scripts/extract-stored-files.mjs [--delete]
//   --delete  diskka muvaffaqiyatli yozilgandan keyin qatordan
//             o'chirishni yoqadi (default: yo'q, faqat ko'chirish).
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

for (const f of [".env", ".env.local"]) {
  const p = path.join(process.cwd(), f);
  if (!fs.existsSync(p)) continue;
  const m = fs.readFileSync(p, "utf8").match(/^\s*DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
  if (m) { process.env.DATABASE_URL = m[1]; break; }
}

const DO_DELETE = process.argv.includes("--delete");
const ROOT = process.cwd();
const PRIVATE_ROOT = path.join(ROOT, "storage", "private");
const prisma = new PrismaClient();

function sanitizeKey(key) {
  return String(key).replace(/\\/g, "/").replace(/\.\.+/g, "");
}

const rows = await prisma.storedFile.findMany({
  select: { key: true, size: true },
  orderBy: { createdAt: "asc" },
});
console.log(`stored_files jami: ${rows.length} qator, ${((rows.reduce((a, r) => a + (r.size || 0), 0)) / 1048576).toFixed(1)} MB`);
console.log(`rejim: ${DO_DELETE ? "ko'chirish + o'chirish" : "faqat ko'chirish (--delete bilan o'chiring)"}\n`);

let written = 0, existed = 0, failed = 0;
for (const r of rows) {
  const safe = sanitizeKey(r.key);
  const dest = path.join(PRIVATE_ROOT, safe);
  try {
    if (fs.existsSync(dest)) {
      existed++;
      if (DO_DELETE) await prisma.storedFile.delete({ where: { key: r.key } }).catch(() => {});
      continue;
    }
    const row = await prisma.storedFile.findUnique({ where: { key: r.key } });
    if (!row) continue;
    const buf = Buffer.from(row.data);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    written++;
    if (written % 10 === 0) {
      console.log(`   ... ${written} ta yozildi, ${((rows.reduce((a, x) => a + (x.size || 0), 0)) / 1048576).toFixed(0)}MB jami`);
    }
    if (DO_DELETE) {
      await prisma.storedFile.delete({ where: { key: r.key } }).catch(() => {});
    }
  } catch (e) {
    failed++;
    console.log(`   x ${r.key}: ${e.message.split("\n").pop().slice(0, 140)}`);
  }
}

const left = await prisma.storedFile.count();
console.log(`\nYakun: yozildi=${written} allaqachon=${existed} xato=${failed}`);
console.log(`stored_files qoldi: ${left} qator`);
await prisma.$disconnect();
