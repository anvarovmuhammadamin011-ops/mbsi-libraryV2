// Kutubxonani aynan TARGET taga qisqartirish.
//
//   node scripts/trim-library.mjs                 # dry-run (hech narsa o'chirmaydi)
//   node scripts/trim-library.mjs --target=599    # maqsadni o'zgartirish
//   node scripts/trim-library.mjs --apply         # HAQIQIY o'chirish
//
// Saralash: PDF mavjudligi, sahifa/hajm mazmunlari, muallif/tavsif,
// muqova + kategoriya bo'yicha sqrt taqsimot (katta guruhlarni kesadi).

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const a = argv.find((x) => x.startsWith(`--${n}=`));
  return a ? a.split("=").slice(1).join("=") : d;
};
const flag = (n) => argv.includes(`--${n}`);

const TARGET = Math.floor(Number(arg("target", "599")));
const APPLY = flag("apply");
const ROOT = process.cwd();
const PRIVATE_ROOT = path.join(ROOT, "storage", "private");
const COVER_ROOT = path.join(ROOT, "public", "covers");

const prisma = new PrismaClient();

const isRemote = (u) => /^https?:\/\//i.test(u || "");
const diskPath = (key) => path.join(PRIVATE_ROOT, key);

function scoreBook(b, coverOk) {
  let s = 0;
  if (b.author) s += 12;
  const desc = (b.description || "").trim();
  if (desc.length >= 200) s += 10;
  else if (desc.length >= 60) s += 6;
  else if (desc.length >= 10) s += 2;

  const p = b.totalPages || 0;
  if (p >= 40 && p <= 600) s += 14;
  else if (p >= 15 && p <= 1200) s += 8;
  else if (p > 0) s -= 8;

  const mb = (b.fileSize || 0) / 1048576;
  if (mb >= 0.3 && mb <= 25) s += 8;
  else if (mb > 0) s += 3;

  if (coverOk) s += 8;
  if (b.language === "UZ") s += 4;
  if (b.isPublished) s += 6;
  if (b.status === "ACTIVE") s += 6;
  return s;
}

// sqrt taqsimot: katta guruhlar butun ustunlik qilmasin,
// lekin kichik kategoriyalar ham o'rin olsin.
function quotasBy(counts, total) {
  const keys = Object.keys(counts);
  const w = {};
  let wsum = 0;
  for (const k of keys) {
    w[k] = Math.sqrt(counts[k]);
    wsum += w[k];
  }
  const q = {};
  for (const k of keys) q[k] = Math.min(counts[k], Math.floor((total * w[k]) / wsum));

  let left = total - keys.reduce((a, k) => a + q[k], 0);
  while (left > 0) {
    const live = keys.filter((k) => q[k] < counts[k]);
    if (!live.length) break;
    // Eng ko'p kam to'lgan kategoriya avval
    live.sort((a, b) => (total * w[b]) / wsum - q[b] - ((total * w[a]) / wsum - q[a]));
    q[live[0]]++;
    left--;
  }
  return q;
}

function inspect(r) {
  const b = r.raw;
  const pdfOk = isRemote(b.pdfUrl)
    ? b.pdfUrl.startsWith("https://")
    : fs.existsSync(diskPath(b.pdfUrl));

  let coverOk = false;
  if (b.coverUrl?.startsWith("/covers/")) {
    coverOk = fs.existsSync(path.join(COVER_ROOT, b.coverUrl.replace("/covers/", "")));
  } else if (b.coverUrl?.startsWith("/api/files/")) {
    coverOk = fs.existsSync(diskPath(decodeURIComponent(b.coverUrl.replace("/api/files/", ""))));
  } else if (b.coverUrl) {
    coverOk = true;
  }

  r.pdfOk = pdfOk;
  r.coverOk = coverOk;
  r.usable = pdfOk && b.status === "ACTIVE" && b.isPublished;
  r.score = scoreBook(b, coverOk);
  return r;
}

async function main() {
  const books = await prisma.book.findMany({
    include: {
      author: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rows = books.map((b) =>
    inspect({
      raw: b,
      id: b.id,
      title: b.title,
      cat: b.categoryId,
      catName: b.category?.name ?? "?",
    })
  );

  const usable = rows.filter((r) => r.usable);
  const unusable = rows.filter((r) => !r.usable);

  console.log(`Jami kitob:            ${rows.length}`);
  console.log(`  ishlatuvchi (PDF+ACTIVE+nashr): ${usable.length}`);
  console.log(`  yaroqsiz (o'chiriladi):         ${unusable.length}`);

  if (!usable.length) {
    console.log("\nIshlatuvchi kitob yo'q — to'xtatildi.");
    await prisma.$disconnect();
    return;
  }

  const keepN = Math.min(TARGET, usable.length);
  const counts = {};
  for (const r of usable) counts[r.cat] = (counts[r.cat] || 0) + 1;
  const quota = quotasBy(counts, keepN);

  const keep = [];
  const dropUsable = [];
  for (const cat of Object.keys(counts)) {
    const group = usable.filter((r) => r.cat === cat).sort((a, b) => b.score - a.score);
    const n = Math.min(quota[cat] || 0, group.length);
    keep.push(...group.slice(0, n));
    dropUsable.push(...group.slice(n));
  }

  // Aynan keepN bo'lishi shart (kvota yig'indisi odatda teng, lekin himoya).
  while (keep.length > keepN) {
    const worst = keep.reduce((a, b) => (a.score <= b.score ? a : b));
    keep.splice(keep.indexOf(worst), 1);
    dropUsable.push(worst);
  }
  const keptIds = new Set(keep.map((r) => r.id));
  const leftovers = usable.filter((r) => !keptIds.has(r.id) && !dropUsable.includes(r));
  dropUsable.push(...leftovers);

  const drop = [...dropUsable, ...unusable];

  console.log(`\nMaqsad: ${TARGET}`);
  console.log(`  saqlanadi:   ${keep.length}`);
  console.log(`  o'chiriladi: ${drop.length}  →  DB'da ${rows.length - drop.length} ta qoladi`);

  console.log("\nKategoriya bo'yicha (saqlanadi / o'chiriladi):");
  const kc = {};
  const dc = {};
  for (const r of keep) kc[r.catName] = (kc[r.catName] || 0) + 1;
  for (const r of drop) dc[r.catName] = (dc[r.catName] || 0) + 1;
  for (const k of Object.keys({ ...kc, ...dc }).sort((a, b) => (kc[b] || 0) - (kc[a] || 0))) {
    console.log(`  ${String(k).padEnd(28)} ${String(kc[k] || 0).padStart(4)} / ${dc[k] || 0}`);
  }

  // Ochiq qoladigan mualliflar
  const dropIds = new Set(drop.map((r) => r.id));
  const keepAuthorIds = new Set(keep.map((r) => r.raw.author?.id).filter(Boolean));
  const orphans = new Set();
  for (const r of drop) {
    const aid = r.raw.author?.id;
    if (aid && !keepAuthorIds.has(aid)) orphans.add(r.raw.author.name);
  }
  console.log(`\nOchiq qoladigan mualliflar: ${orphans.size} ta`);

  const bytes = drop.reduce((s, r) => s + (r.raw.fileSize || 0), 0);
  console.log(`Disk tejawi (taxminiy): ${(bytes / 1048576).toFixed(0)} MB, ${drop.length} ta PDF`);

  console.log("\nO'chiriladiganlarning eng past balli 25 tasi:");
  const sorted = [...dropUsable].sort((a, b) => a.score - b.score);
  for (const r of sorted.slice(0, 25)) {
    console.log(`   - [${r.catName}] ${r.title.slice(0, 52)} (score ${r.score})`);
  }
  if (sorted.length > 25) console.log(`   ... va yana ${sorted.length - 25} ta`);
  if (unusable.length) console.log(`   + ${unusable.length} ta yaroqsiz (PDF yo'q / nashr qilinmagan)`);

  if (!APPLY) {
    console.log("\nDRY-RUN — hech narsa o'chirilmadi. Haqiqiy uchun: --apply");
    await prisma.$disconnect();
    return;
  }

  // ── Haqiqiy o'chirish ──────────────────────────────────────
  console.log("\nO'chirilmoqda...");
  let removedFiles = 0;
  let freed = 0;

  for (const r of drop) {
    const b = r.raw;
    if (b.pdfUrl && !isRemote(b.pdfUrl)) {
      const p = diskPath(b.pdfUrl);
      try {
        if (fs.existsSync(p)) {
          freed += fs.statSync(p).size;
          fs.unlinkSync(p);
          removedFiles++;
        }
      } catch (e) {
        console.log(`   ! PDF o'chirilmadi: ${b.pdfUrl} — ${e.message}`);
      }
    }
    if (b.coverUrl?.startsWith("/covers/")) {
      try {
        const p = path.join(COVER_ROOT, b.coverUrl.replace("/covers/", ""));
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } catch {
        /* muqova ixtiyoriy */
      }
    }
  }

  // Barcha bog'liq yozuvlar Book'dan onDelete: Cascade bilan tushadi.
  const ids = drop.map((r) => r.id);
  const CHUNK = 200;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const part = ids.slice(i, i + CHUNK);
    const res = await prisma.book.deleteMany({ where: { id: { in: part } } });
    console.log(`   o'chirildi: ${res.count} ta`);
  }

  const orphanAuthors = await prisma.author.findMany({
    where: { books: { none: {} } },
    select: { id: true },
  });
  if (orphanAuthors.length) {
    await prisma.author.deleteMany({ where: { id: { in: orphanAuthors.map((o) => o.id) } } });
  }

  const left = await prisma.book.count();
  console.log(`\nTayyor: DB'da ${left} ta kitob`);
  console.log(`  o'chirilgan PDF: ${removedFiles} ta, ${(freed / 1048576).toFixed(0)} MB`);
  console.log(`  o'chirilgan muallif: ${orphanAuthors.length} ta`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
