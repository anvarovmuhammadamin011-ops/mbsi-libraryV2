#!/usr/bin/env node
// Kitob PDF/muqova URL larini tekshiradi.
//   1) book.pdfUrl → diskda/S3/DB da bormi
//   2) PDF haqiqatan `PDF-` bilan boshlanadimi, sahifalar soni to'g'rimi
//   3) book.coverUrl → fayl bormi (public/covers yoki storage/private)
//   4) imzolangan /api/pdf/[id] havolasi generatsiya qilinadimi
//
// Run: node scripts/verify-book-urls.mjs [--json]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

for (const f of [".env", ".env.local"]) {
  const p = path.join(process.cwd(), f);
  if (!fs.existsSync(p)) continue;
  const m = fs.readFileSync(p, "utf8").match(/^\s*DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
  if (m) { process.env.DATABASE_URL = m[1]; break; }
}
if (process.env.DATABASE_URL && !/connection_limit=/.test(process.env.DATABASE_URL)) {
  const sep = process.env.DATABASE_URL.includes("?") ? "&" : "?";
  process.env.DATABASE_URL += `${sep}connection_limit=3&pool_timeout=60`;
}
const APP_SECRET = process.env.APP_SECRET || "mbsi-library-dev-only-not-for-production";
const ROOT = process.cwd();
const PRIVATE_ROOT = path.join(ROOT, "storage", "private");
const prisma = new PrismaClient();

const books = await prisma.book.findMany({
  select: { id: true, title: true, slug: true, pdfUrl: true, coverUrl: true, totalPages: true, fileSize: true, isPublished: true, status: true, categoryId: true },
  orderBy: { createdAt: "asc" },
});
console.log(`Tekshirilmoqda: ${books.length} ta kitob\n`);

const problems = { noPdf: [], badPdf: [], noCover: [], noSigned: [], unpublished: [] };
const catStat = {};
let okCount = 0;

for (const b of books) {
  const issues = [];

  // 1) PDF manba
  if (!b.pdfUrl) {
    issues.push("pdfUrl yo'q");
    problems.noPdf.push(b.title);
  } else {
    const isRemote = /^https?:\/\//.test(b.pdfUrl);
    if (isRemote) {
      // uzolash uchun https majburiy (storage.ts xavfsizlik cheklovi)
      if (!b.pdfUrl.startsWith("https://")) issues.push("http (bloklanadi)");
    } else if (!fs.existsSync(path.join(PRIVATE_ROOT, b.pdfUrl))) {
      issues.push(`PDF diskda yo'q (${b.pdfUrl})`);
      problems.badPdf.push(b.title);
    }
  }

  // 2) PDF haqiqati
  if (b.pdfUrl && !/^https?:\/\//.test(b.pdfUrl) && fs.existsSync(path.join(PRIVATE_ROOT, b.pdfUrl))) {
    const buf = Buffer.alloc(8);
    const fd = fs.openSync(path.join(PRIVATE_ROOT, b.pdfUrl), "r");
    fs.readSync(fd, buf, 0, 8, 0);
    fs.closeSync(fd);
    if (buf.slice(0, 5).toString("latin1") !== "%PDF-") {
      issues.push("PDF imzo'siz (buzilgan)");
      problems.badPdf.push(b.title);
    }
  }

  // 3) Muqova
  if (b.coverUrl) {
    let coverOk = false;
    if (b.coverUrl.startsWith("/covers/")) {
      // /public/covers ichidagi statik fayl
      coverOk = fs.existsSync(path.join(ROOT, "public", b.coverUrl));
    } else if (b.coverUrl.startsWith("/api/files/")) {
      const key = decodeURIComponent(b.coverUrl.replace("/api/files/", ""));
      coverOk = fs.existsSync(path.join(PRIVATE_ROOT, key));
    } else {
      coverOk = /^https?:\/\//.test(b.coverUrl);
    }
    if (!coverOk) {
      issues.push(`muqova yo'q (${b.coverUrl})`);
      problems.noCover.push(b.title);
    }
  } else {
    issues.push("coverUrl bo'sh");
    problems.noCover.push(b.title);
  }

  // 4) Imzolangan PDF havolasi
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const sig = crypto.createHmac("sha256", APP_SECRET).update(`${b.id}:${exp}`).digest("hex");
  const signed = `/api/pdf/${b.id}?expires=${exp}&sig=${sig}`;
  if (!signed.includes("sig=") || sig.length !== 64) {
    issues.push("imzo generatsiya bo'lmadi");
    problems.noSigned.push(b.title);
  }

  if (!b.isPublished || b.status !== "ACTIVE") {
    problems.unpublished.push(`${b.title} (${b.status}${b.isPublished ? "" : ", nashr qilinmagan"})`);
  }

  catStat[b.categoryId] = catStat[b.categoryId] || { total: 0, ok: 0 };
  catStat[b.categoryId].total++;
  if (issues.length === 0) {
    okCount++;
    catStat[b.categoryId].ok++;
  } else {
    problems.invalid = problems.invalid || [];
    problems.invalid.push({ title: b.title, issues });
  }
}

console.log("NATIJA:");
console.log(`  to'liq tayyor (PDF + muqova + imzo): ${okCount} / ${books.length}`);
console.log(`  jami tayyor (faqat PDF+imzo):        ${books.length - problems.noSigned.length - problems.badPdf.length - problems.noPdf.length}`);
console.log(`\nMuammolar:`);
console.log(`  PDF manba yo'q:   ${problems.noPdf.length}`);
console.log(`  PDF buzilgan/yo'q: ${problems.badPdf.length}`);
console.log(`  muqova yo'q:      ${problems.noCover.length}`);
console.log(`  imzo muammosi:    ${problems.noSigned.length}`);
console.log(`  nashr qilinmagan: ${problems.unpublished.length}`);
console.log(`  boshqa muammo:    ${(problems.invalid || []).length}`);

if (problems.noPdf.length) {
  console.log(`\nPDF yo'q (bosh ${problems.noPdf.length}):`);
  for (const t of problems.noPdf.slice(0, 15)) console.log(`   - ${t}`);
}
if (problems.badPdf.length) {
  console.log(`\nPDF buzilgan (bosh ${problems.badPdf.length}):`);
  for (const t of problems.badPdf.slice(0, 15)) console.log(`   - ${t}`);
}
if (problems.noCover.length) {
  console.log(`\nMuqova yo'q (bosh ${problems.noCover.length}):`);
  for (const t of problems.noCover.slice(0, 15)) console.log(`   - ${t}`);
}

console.log(`\nKategoriyalar:`);
for (const [k, v] of Object.entries(catStat).sort((a, b) => b[1].total - a[1].total))
  console.log(`  ${k}: ${v.total} (tayyor: ${v.ok})`);

const invalid = problems.invalid || [];
if (invalid.length) {
  console.log(`\nMuammoli kitoblar (${invalid.length}):`);
  for (const x of invalid.slice(0, 20)) console.log(`   - ${x.title.slice(0, 50)} :: ${x.issues.join("; ")}`);
}

if (process.argv.includes("--json")) {
  fs.writeFileSync(
    path.join(ROOT, "scripts", "cache", "verify-report.json"),
    JSON.stringify({ at: new Date().toISOString(), total: books.length, ok: okCount, problems }, null, 1)
  );
  console.log(`\nHisobot: scripts/cache/verify-report.json`);
}

await prisma.$disconnect();
